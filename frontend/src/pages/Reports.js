import React, { useState, useEffect, useContext, useMemo } from 'react';
import api from '../services/api';
import AIOutput from '../components/AIOutput';
import { ToastContext } from '../App';

function Reports() {
  const addToast = useContext(ToastContext);
  const [loading, setLoading] = useState(true);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [datePreset, setDatePreset] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [quotes, setQuotes] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [projects, setProjects] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [contracts, setContracts] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [
          quotesRes, materialsRes, invoicesRes, expensesRes, schedulesRes,
          projectsRes, techniciansRes, customersRes, contractsRes
        ] = await Promise.all([
          api.get('/job-quotes'),
          api.get('/materials'),
          api.get('/invoices'),
          api.get('/expenses'),
          api.get('/schedules'),
          api.get('/projects'),
          api.get('/technicians'),
          api.get('/customers'),
          api.get('/service-contracts')
        ]);
        setQuotes(quotesRes.data);
        setMaterials(materialsRes.data);
        setInvoices(invoicesRes.data);
        setExpenses(expensesRes.data);
        setSchedules(schedulesRes.data);
        setProjects(projectsRes.data);
        setTechnicians(techniciansRes.data);
        setCustomers(customersRes.data);
        setContracts(contractsRes.data);
      } catch (err) {
        console.error('Failed to fetch report data:', err);
        addToast('Failed to load report data', 'error');
      }
      setLoading(false);
    };
    fetchAll();
  }, [addToast]);

  // Date range presets
  const handlePreset = (preset) => {
    setDatePreset(preset);
    const now = new Date();
    let start = '';
    let end = now.toISOString().split('T')[0];
    switch (preset) {
      case '7d':
        start = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
        break;
      case '30d':
        start = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
        break;
      case '90d':
        start = new Date(now.getTime() - 90 * 86400000).toISOString().split('T')[0];
        break;
      case 'ytd':
        start = `${now.getFullYear()}-01-01`;
        break;
      case 'all':
        start = '';
        end = '';
        break;
      default: return;
    }
    setStartDate(start);
    setEndDate(end);
  };

  // Filter by date range helper
  const inRange = (dateStr) => {
    if (!startDate && !endDate) return true;
    if (!dateStr) return true;
    const d = new Date(dateStr);
    if (startDate && d < new Date(startDate)) return false;
    if (endDate && d > new Date(endDate + 'T23:59:59')) return false;
    return true;
  };

  // Filtered data
  const filteredInvoices = useMemo(() => invoices.filter(i => inRange(i.createdAt)), [invoices, startDate, endDate]);
  const filteredExpenses = useMemo(() => expenses.filter(e => inRange(e.createdAt || e.date)), [expenses, startDate, endDate]);
  const filteredQuotes = useMemo(() => quotes.filter(q => inRange(q.createdAt)), [quotes, startDate, endDate]);

  // Revenue calculations
  const totalInvoiced = filteredInvoices.reduce((sum, i) => sum + parseFloat(i.totalAmount || 0), 0);
  const paidAmount = filteredInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + parseFloat(i.totalAmount || 0), 0);
  const pendingAmount = filteredInvoices.filter(i => i.status === 'pending' || i.status === 'sent' || i.status === 'draft').reduce((sum, i) => sum + parseFloat(i.totalAmount || 0), 0);
  const overdueAmount = filteredInvoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + parseFloat(i.totalAmount || 0), 0);

  // Expense calculations
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const expensesByCategory = filteredExpenses.reduce((acc, e) => {
    const cat = e.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + parseFloat(e.amount || 0);
    return acc;
  }, {});

  // Profitability
  const profit = paidAmount - totalExpenses;
  const profitMargin = paidAmount > 0 ? ((profit / paidAmount) * 100).toFixed(1) : '0.0';

  // Job performance
  const quotesByStatus = filteredQuotes.reduce((acc, q) => {
    const status = q.status || 'pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  const projectsByStatus = projects.reduce((acc, p) => {
    const status = p.status || 'pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // Conversion rate
  const conversionRate = filteredQuotes.length > 0
    ? ((filteredQuotes.filter(q => q.status === 'approved' || q.status === 'completed').length / filteredQuotes.length) * 100).toFixed(1)
    : '0.0';

  // Average invoice value
  const avgInvoice = filteredInvoices.length > 0
    ? (totalInvoiced / filteredInvoices.length).toFixed(2)
    : '0.00';

  // Team stats
  const avgRating = technicians.length
    ? (technicians.reduce((sum, t) => sum + parseFloat(t.rating || 0), 0) / technicians.length).toFixed(1)
    : '0.0';
  const totalJobsCompleted = technicians.reduce((sum, t) => sum + parseInt(t.jobsCompleted || 0), 0);

  // Customer stats
  const avgCustomerRating = customers.length
    ? (customers.reduce((sum, c) => sum + parseFloat(c.rating || 0), 0) / customers.length).toFixed(1)
    : '0.0';
  const topSpenders = [...customers]
    .sort((a, b) => parseFloat(b.totalSpent || 0) - parseFloat(a.totalSpent || 0))
    .slice(0, 5);

  // Contract revenue
  const activeContracts = contracts.filter(c => c.status === 'active');
  const monthlyRecurring = activeContracts.reduce((sum, c) => sum + parseFloat(c.monthlyAmount || c.amount || 0), 0);

  // Collection rate
  const collectionRate = totalInvoiced > 0 ? ((paidAmount / totalInvoiced) * 100).toFixed(1) : '0.0';

  const fmt = (val) => `$${parseFloat(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // CSV Export
  const exportCSV = (type) => {
    let csvContent = '';
    let filename = '';

    switch (type) {
      case 'revenue':
        csvContent = 'Invoice #,Customer,Description,Amount,Status,Due Date,Created\n';
        filteredInvoices.forEach(i => {
          csvContent += `"${i.invoiceNumber}","${i.customerName}","${(i.jobDescription || '').replace(/"/g, '""')}",${i.totalAmount || 0},"${i.status}","${i.dueDate || ''}","${i.createdAt || ''}"\n`;
        });
        filename = 'revenue-report.csv';
        break;
      case 'expenses':
        csvContent = 'Description,Category,Amount,Date\n';
        filteredExpenses.forEach(e => {
          csvContent += `"${(e.description || '').replace(/"/g, '""')}","${e.category || ''}",${e.amount || 0},"${e.date || e.createdAt || ''}"\n`;
        });
        filename = 'expenses-report.csv';
        break;
      case 'customers':
        csvContent = 'Name,Email,Phone,City,Property Type,Total Spent,Job Count,Rating\n';
        customers.forEach(c => {
          csvContent += `"${c.name}","${c.email || ''}","${c.phone || ''}","${c.city || ''}","${c.propertyType || ''}",${c.totalSpent || 0},${c.jobCount || 0},${c.rating || 0}\n`;
        });
        filename = 'customers-report.csv';
        break;
      case 'quotes':
        csvContent = 'Title,Type,Customer,Estimated Cost,Labor Hours,Status,Priority,Created\n';
        filteredQuotes.forEach(q => {
          csvContent += `"${q.title}","${q.jobType}","${q.customerName}",${q.estimatedCost || 0},${q.laborHours || 0},"${q.status}","${q.priority}","${q.createdAt || ''}"\n`;
        });
        filename = 'quotes-report.csv';
        break;
      case 'summary':
        csvContent = 'Metric,Value\n';
        csvContent += `Total Invoiced,${totalInvoiced}\n`;
        csvContent += `Paid Revenue,${paidAmount}\n`;
        csvContent += `Pending Amount,${pendingAmount}\n`;
        csvContent += `Overdue Amount,${overdueAmount}\n`;
        csvContent += `Total Expenses,${totalExpenses}\n`;
        csvContent += `Net Profit,${profit}\n`;
        csvContent += `Profit Margin,${profitMargin}%\n`;
        csvContent += `Collection Rate,${collectionRate}%\n`;
        csvContent += `Quote Conversion Rate,${conversionRate}%\n`;
        csvContent += `Average Invoice,${avgInvoice}\n`;
        csvContent += `Total Customers,${customers.length}\n`;
        csvContent += `Total Technicians,${technicians.length}\n`;
        csvContent += `Monthly Recurring Revenue,${monthlyRecurring}\n`;
        filename = 'business-summary.csv';
        break;
      default: return;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    addToast(`Exported ${filename}`);
  };

  const handleAIAnalysis = async () => {
    setAiLoading(true);
    setAiResult('');
    try {
      const { data } = await api.post('/invoices/ai/analyze', {
        totalInvoiced,
        paidAmount,
        pendingAmount,
        overdueAmount,
        totalExpenses,
        expensesByCategory,
        profit,
        quotesByStatus,
        projectsByStatus,
        technicianCount: technicians.length,
        avgTechRating: avgRating,
        totalJobsCompleted,
        customerCount: customers.length,
        avgCustomerRating,
        monthlyRecurring,
        activeContractCount: activeContracts.length
      });
      setAiResult(data.analysis);
      addToast('AI analysis complete');
    } catch (err) {
      setAiResult('AI analysis failed. Please check your OpenRouter API key.');
      addToast('AI analysis failed', 'error');
    }
    setAiLoading(false);
  };

  if (loading) {
    return (
      <>
        <div className="page-header">
          <div>
            <h2>Reports & Analytics</h2>
            <div className="subtitle">Comprehensive business intelligence</div>
          </div>
        </div>
        <div className="page-body">
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Loading report data...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Reports & Analytics</h2>
          <div className="subtitle">Comprehensive business intelligence</div>
        </div>
        <div className="btn-group">
          <button className="btn btn-export" onClick={() => exportCSV('summary')}>📥 Export Summary</button>
          <button className="btn btn-primary" onClick={handleAIAnalysis} disabled={aiLoading}>
            {aiLoading ? 'Analyzing...' : 'AI Business Analysis'}
          </button>
        </div>
      </div>
      <div className="page-body">

        {/* Date Range Filter */}
        <div className="date-range-filter">
          <label>Date Range:</label>
          {['7d', '30d', '90d', 'ytd', 'all'].map(p => (
            <button
              key={p}
              className={`date-preset-btn ${datePreset === p ? 'active' : ''}`}
              onClick={() => handlePreset(p)}
            >
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : p === 'ytd' ? 'YTD' : 'All Time'}
            </button>
          ))}
          <span style={{ color: '#9ca3af' }}>|</span>
          <label>From:</label>
          <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setDatePreset('custom'); }} />
          <label>To:</label>
          <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setDatePreset('custom'); }} />
        </div>

        <AIOutput content={aiResult} loading={aiLoading} title="AI Business Analysis" />

        {/* Profitability */}
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#111827' }}>Profitability</h3>
        <div className="dashboard-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: profit >= 0 ? '#ecfdf5' : '#fef2f2', color: profit >= 0 ? '#059669' : '#ef4444' }}>
              {profit >= 0 ? '📈' : '📉'}
            </div>
            <div className="stat-value" style={{ color: profit >= 0 ? '#059669' : '#ef4444' }}>{fmt(profit)}</div>
            <div className="stat-label">Net Profit</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>💵</div>
            <div className="stat-value">{fmt(paidAmount)}</div>
            <div className="stat-label">Total Revenue (Paid)</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>💸</div>
            <div className="stat-value">{fmt(totalExpenses)}</div>
            <div className="stat-label">Total Expenses</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>📊</div>
            <div className="stat-value">{profitMargin}%</div>
            <div className="stat-label">Profit Margin</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>🎯</div>
            <div className="stat-value">{collectionRate}%</div>
            <div className="stat-label">Collection Rate</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}>📋</div>
            <div className="stat-value">{conversionRate}%</div>
            <div className="stat-label">Quote Conversion Rate</div>
          </div>
        </div>

        {/* Revenue Section */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 32, marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Revenue</h3>
          <button className="btn btn-sm btn-export" onClick={() => exportCSV('revenue')}>📥 Export CSV</button>
        </div>
        <div className="dashboard-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>💰</div>
            <div className="stat-value">{fmt(totalInvoiced)}</div>
            <div className="stat-label">Total Invoiced ({filteredInvoices.length})</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>✅</div>
            <div className="stat-value">{fmt(paidAmount)}</div>
            <div className="stat-label">Paid</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fffbeb', color: '#f59e0b' }}>⏳</div>
            <div className="stat-value">{fmt(pendingAmount)}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>⚠️</div>
            <div className="stat-value">{fmt(overdueAmount)}</div>
            <div className="stat-label">Overdue</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>📊</div>
            <div className="stat-value">{fmt(avgInvoice)}</div>
            <div className="stat-label">Average Invoice Value</div>
          </div>
        </div>

        {/* Expenses Section */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 32, marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Expenses by Category</h3>
          <button className="btn btn-sm btn-export" onClick={() => exportCSV('expenses')}>📥 Export CSV</button>
        </div>
        <div className="dashboard-grid">
          {Object.entries(expensesByCategory).map(([category, amount]) => (
            <div key={category} className="stat-card">
              <div className="stat-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>📊</div>
              <div className="stat-value">{fmt(amount)}</div>
              <div className="stat-label">{category}</div>
            </div>
          ))}
          {Object.keys(expensesByCategory).length === 0 && (
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#f3f4f6', color: '#6b7280' }}>📊</div>
              <div className="stat-value">$0.00</div>
              <div className="stat-label">No Expenses</div>
            </div>
          )}
        </div>

        {/* Job Performance */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 32, marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Job Performance</h3>
          <button className="btn btn-sm btn-export" onClick={() => exportCSV('quotes')}>📥 Export CSV</button>
        </div>
        <div className="dashboard-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>📋</div>
            <div className="stat-value">{filteredQuotes.length}</div>
            <div className="stat-label">Total Quotes</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fffbeb', color: '#f59e0b' }}>⏳</div>
            <div className="stat-value">{quotesByStatus.pending || 0}</div>
            <div className="stat-label">Pending Quotes</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>✅</div>
            <div className="stat-value">{quotesByStatus.approved || 0}</div>
            <div className="stat-label">Approved Quotes</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>🏁</div>
            <div className="stat-value">{quotesByStatus.completed || 0}</div>
            <div className="stat-label">Completed Quotes</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>📁</div>
            <div className="stat-value">{projects.length}</div>
            <div className="stat-label">Total Projects</div>
          </div>
          {Object.entries(projectsByStatus).map(([status, count]) => (
            <div key={status} className="stat-card">
              <div className="stat-icon" style={{ background: '#f3f4f6', color: '#6b7280' }}>📂</div>
              <div className="stat-value">{count}</div>
              <div className="stat-label">Projects: {status}</div>
            </div>
          ))}
        </div>

        {/* Team Stats */}
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, marginTop: 32, color: '#111827' }}>Team Stats</h3>
        <div className="dashboard-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>👷</div>
            <div className="stat-value">{technicians.length}</div>
            <div className="stat-label">Technicians</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fffbeb', color: '#f59e0b' }}>⭐</div>
            <div className="stat-value">{avgRating}</div>
            <div className="stat-label">Average Rating</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>🏆</div>
            <div className="stat-value">{totalJobsCompleted}</div>
            <div className="stat-label">Jobs Completed</div>
          </div>
        </div>

        {/* Customer Stats */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 32, marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Customer Stats</h3>
          <button className="btn btn-sm btn-export" onClick={() => exportCSV('customers')}>📥 Export CSV</button>
        </div>
        <div className="dashboard-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>👥</div>
            <div className="stat-value">{customers.length}</div>
            <div className="stat-label">Total Customers</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fffbeb', color: '#f59e0b' }}>⭐</div>
            <div className="stat-value">{avgCustomerRating}</div>
            <div className="stat-label">Average Customer Rating</div>
          </div>
        </div>
        {topSpenders.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: '#374151' }}>Top 5 Spenders</h4>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              {topSpenders.map((c, i) => (
                <div key={c.id || i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 20px', borderBottom: i < topSpenders.length - 1 ? '1px solid #f3f4f6' : 'none'
                }}>
                  <span style={{ fontWeight: 500, color: '#111827' }}>
                    {i + 1}. {c.name || c.companyName || 'Unknown'}
                  </span>
                  <span style={{ fontWeight: 600, color: '#059669' }}>{fmt(c.totalSpent || 0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contract Revenue */}
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, marginTop: 32, color: '#111827' }}>Contract Revenue</h3>
        <div className="dashboard-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>📄</div>
            <div className="stat-value">{activeContracts.length}</div>
            <div className="stat-label">Active Contracts</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>🔄</div>
            <div className="stat-value">{fmt(monthlyRecurring)}</div>
            <div className="stat-label">Monthly Recurring Revenue</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>📅</div>
            <div className="stat-value">{fmt(monthlyRecurring * 12)}</div>
            <div className="stat-label">Annual Contract Value</div>
          </div>
        </div>

      </div>
    </>
  );
}

export default Reports;
