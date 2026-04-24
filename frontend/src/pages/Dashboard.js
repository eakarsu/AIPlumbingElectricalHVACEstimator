import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [allData, setAllData] = useState({});

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const endpoints = [
          'job-quotes', 'materials', 'code-compliance', 'schedules', 'invoices',
          'customers', 'technicians', 'projects', 'expenses', 'warranties',
          'equipment', 'service-contracts', 'permits', 'suppliers'
        ];
        const results = await Promise.all(endpoints.map(e => api.get(`/${e}`).catch(() => ({ data: [] }))));
        const [quotes, materials, compliance, schedules, invoices, customers, technicians, projects, expenses, warranties, equipment, contracts, permits, suppliers] = results.map(r => r.data);

        const paidRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + parseFloat(i.totalAmount || 0), 0);
        const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);

        setStats({
          quotes: quotes.length, materials: materials.length, compliance: compliance.length,
          schedules: schedules.length, invoices: invoices.length, customers: customers.length,
          technicians: technicians.length, projects: projects.length, expenses: expenses.length,
          warranties: warranties.length, equipment: equipment.length, contracts: contracts.length,
          permits: permits.length, suppliers: suppliers.length,
          revenue: paidRevenue, totalExpenses, profit: paidRevenue - totalExpenses
        });
        setAllData({ quotes, materials, invoices, schedules, customers, projects, expenses, warranties, equipment, contracts, permits, suppliers });
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchStats();
  }, []);

  // Recent activity: combine recent items from various modules
  const recentActivity = useMemo(() => {
    if (!allData.invoices) return [];
    const activities = [];

    (allData.invoices || []).forEach(i => {
      activities.push({
        type: 'invoice', icon: '💰', bg: '#ecfdf5', color: '#059669',
        title: `Invoice ${i.invoiceNumber} - ${i.customerName}`,
        meta: i.status === 'paid' ? 'Paid' : i.status,
        amount: `$${parseFloat(i.totalAmount || 0).toLocaleString()}`,
        amountColor: i.status === 'paid' ? '#059669' : i.status === 'overdue' ? '#dc2626' : '#3b82f6',
        date: i.updatedAt || i.createdAt
      });
    });

    (allData.quotes || []).forEach(q => {
      activities.push({
        type: 'quote', icon: '📋', bg: '#eff6ff', color: '#3b82f6',
        title: `Quote: ${q.title}`,
        meta: `${q.jobType} - ${q.customerName}`,
        amount: `$${parseFloat(q.estimatedCost || 0).toLocaleString()}`,
        amountColor: '#3b82f6',
        date: q.updatedAt || q.createdAt
      });
    });

    (allData.expenses || []).forEach(e => {
      activities.push({
        type: 'expense', icon: '💳', bg: '#fef2f2', color: '#dc2626',
        title: `Expense: ${e.description || e.category}`,
        meta: e.category,
        amount: `-$${parseFloat(e.amount || 0).toLocaleString()}`,
        amountColor: '#dc2626',
        date: e.updatedAt || e.createdAt
      });
    });

    return activities
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 8);
  }, [allData]);

  // Upcoming deadlines
  const upcomingDeadlines = useMemo(() => {
    if (!allData.invoices) return [];
    const deadlines = [];
    const today = new Date();

    (allData.invoices || []).filter(i => i.dueDate && i.status !== 'paid').forEach(i => {
      const due = new Date(i.dueDate);
      deadlines.push({
        date: due, type: 'invoice',
        title: `Invoice ${i.invoiceNumber} due`,
        subtitle: `${i.customerName} - $${parseFloat(i.totalAmount || 0).toLocaleString()}`,
        overdue: due < today,
        path: '/invoices'
      });
    });

    (allData.schedules || []).filter(s => s.date || s.scheduledDate).forEach(s => {
      const date = new Date(s.date || s.scheduledDate);
      if (date >= today) {
        deadlines.push({
          date, type: 'schedule',
          title: s.title || s.jobDescription || 'Scheduled Job',
          subtitle: s.technicianName || s.customerName || '',
          overdue: false,
          path: '/schedules'
        });
      }
    });

    (allData.permits || []).filter(p => p.expirationDate || p.inspectionDate).forEach(p => {
      const date = new Date(p.expirationDate || p.inspectionDate);
      deadlines.push({
        date, type: 'permit',
        title: `Permit: ${p.permitNumber || p.type || 'Permit'}`,
        subtitle: p.status || '',
        overdue: date < today,
        path: '/permits'
      });
    });

    (allData.warranties || []).filter(w => w.expirationDate).forEach(w => {
      const exp = new Date(w.expirationDate);
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      if (exp <= thirtyDaysFromNow) {
        deadlines.push({
          date: exp, type: 'warranty',
          title: `Warranty expiring: ${w.productName || w.description || 'Warranty'}`,
          subtitle: w.customerName || '',
          overdue: exp < today,
          path: '/warranties'
        });
      }
    });

    return deadlines.sort((a, b) => a.date - b.date).slice(0, 8);
  }, [allData]);

  // Overdue invoices alert
  const overdueInvoices = useMemo(() =>
    (allData.invoices || []).filter(i => i.status === 'overdue'),
    [allData]
  );

  // Low stock materials
  const lowStockMaterials = useMemo(() =>
    (allData.materials || []).filter(m => !m.inStock || (m.inStock && parseInt(m.quantity || 0) <= parseInt(m.minOrderQty || 5))),
    [allData]
  );

  // Quote conversion rate
  const conversionRate = useMemo(() => {
    const q = allData.quotes || [];
    if (q.length === 0) return 0;
    const approved = q.filter(x => x.status === 'approved' || x.status === 'completed').length;
    return Math.round((approved / q.length) * 100);
  }, [allData]);

  const topStats = [
    { label: 'Revenue (Paid)', value: `$${(stats.revenue || 0).toLocaleString()}`, icon: '💰', color: '#059669', bg: '#ecfdf5' },
    { label: 'Total Expenses', value: `$${(stats.totalExpenses || 0).toLocaleString()}`, icon: '💳', color: '#dc2626', bg: '#fef2f2' },
    { label: 'Net Profit', value: `$${(stats.profit || 0).toLocaleString()}`, icon: '📈', color: (stats.profit || 0) >= 0 ? '#059669' : '#dc2626', bg: (stats.profit || 0) >= 0 ? '#ecfdf5' : '#fef2f2' },
    { label: 'Active Projects', value: stats.projects || 0, icon: '🏗️', color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'Quote Conversion', value: `${conversionRate}%`, icon: '🎯', color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Team Members', value: stats.technicians || 0, icon: '👷', color: '#f59e0b', bg: '#fffbeb' },
  ];

  const featureCards = [
    { title: 'Job Quotes & Estimation', description: 'AI-powered cost estimation from job descriptions. Create professional quotes instantly.', icon: '📋', className: 'plumbing', path: '/job-quotes', count: stats.quotes },
    { title: 'Materials & Pricing', description: 'Manage inventory with real-time pricing. AI estimates material needs for any project.', icon: '🔧', className: 'electrical', path: '/materials', count: stats.materials },
    { title: 'Building Code Compliance', description: 'Stay compliant with IPC, NEC, and IMC codes. AI checks against current regulations.', icon: '📜', className: 'hvac', path: '/code-compliance', count: stats.compliance },
    { title: 'Job Scheduling', description: 'Manage technician schedules and optimize routes. AI suggests efficient job ordering.', icon: '📅', className: 'scheduling', path: '/schedules', count: stats.schedules },
    { title: 'Invoicing & Billing', description: 'Professional invoices with auto tax calculations. AI analyzes pricing competitiveness.', icon: '💰', className: 'invoicing', path: '/invoices', count: stats.invoices },
    { title: 'Customer Management', description: 'Full CRM for your customers. Track history, preferences, and get AI retention insights.', icon: '👥', className: 'plumbing', path: '/customers', count: stats.customers },
    { title: 'Technician Management', description: 'Manage your team, certifications, and workload. AI optimizes job assignments.', icon: '👷', className: 'electrical', path: '/technicians', count: stats.technicians },
    { title: 'Project Tracking', description: 'Track project progress, budgets, and timelines. AI analyzes project health.', icon: '🏗️', className: 'hvac', path: '/projects', count: stats.projects },
    { title: 'Expense Tracking', description: 'Track all business expenses by category. AI identifies savings opportunities.', icon: '💳', className: 'scheduling', path: '/expenses', count: stats.expenses },
    { title: 'Warranty Tracking', description: 'Track product and labor warranties. Never miss a warranty claim deadline.', icon: '🛡️', className: 'invoicing', path: '/warranties', count: stats.warranties },
    { title: 'Equipment Management', description: 'Track tools, vehicles, and equipment. Monitor maintenance schedules and depreciation.', icon: '🛠️', className: 'plumbing', path: '/equipment', count: stats.equipment },
    { title: 'Service Contracts', description: 'Manage recurring service agreements. Track visits, renewals, and monthly revenue.', icon: '📝', className: 'electrical', path: '/service-contracts', count: stats.contracts },
    { title: 'Permits & Inspections', description: 'Track building permits, fees, and inspection results. AI guides permit requirements.', icon: '📄', className: 'hvac', path: '/permits', count: stats.permits },
    { title: 'Supplier Management', description: 'Manage vendors, pricing, and supply chain. AI optimizes procurement strategy.', icon: '🏭', className: 'scheduling', path: '/suppliers', count: stats.suppliers },
    { title: 'Reports & Analytics', description: 'Comprehensive business intelligence. AI-powered insights across all operations.', icon: '📈', className: 'invoicing', path: '/reports', count: null },
  ];

  const formatDate = (d) => {
    const date = new Date(d);
    return { day: date.getDate(), month: date.toLocaleString('en', { month: 'short' }) };
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <>
        <div className="page-header"><div><h2>Dashboard</h2></div></div>
        <div className="page-body" style={{ textAlign: 'center', padding: 60 }}>
          <div className="ai-loading"><div className="spinner"></div><p>Loading dashboard...</p></div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <div className="subtitle">Welcome back! Here's your business overview.</div>
        </div>
        <button className="btn btn-ai" onClick={() => navigate('/reports')}>📈 Full Reports</button>
      </div>
      <div className="page-body">
        {/* Alerts */}
        {overdueInvoices.length > 0 && (
          <div className="alert-banner alert-banner-danger" style={{ cursor: 'pointer' }} onClick={() => navigate('/invoices')}>
            <span className="alert-icon">⚠️</span>
            <span><strong>{overdueInvoices.length} overdue invoice{overdueInvoices.length > 1 ? 's' : ''}</strong> totaling ${overdueInvoices.reduce((s, i) => s + parseFloat(i.totalAmount || 0), 0).toLocaleString()}</span>
            <span className="alert-actions"><button className="btn btn-sm btn-danger">View</button></span>
          </div>
        )}
        {lowStockMaterials.length > 0 && (
          <div className="alert-banner alert-banner-warning" style={{ cursor: 'pointer' }} onClick={() => navigate('/materials')}>
            <span className="alert-icon">📦</span>
            <span><strong>{lowStockMaterials.length} material{lowStockMaterials.length > 1 ? 's' : ''}</strong> need restocking</span>
            <span className="alert-actions"><button className="btn btn-sm btn-warning">View</button></span>
          </div>
        )}

        {/* Top Stats */}
        <div className="dashboard-grid">
          {topStats.map((card, i) => (
            <div key={i} className="stat-card">
              <div className="stat-icon" style={{ background: card.bg, color: card.color }}>{card.icon}</div>
              <div className="stat-value">{card.value}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Recent Activity + Upcoming Deadlines */}
        <div className="dashboard-two-col">
          {/* Recent Activity */}
          <div className="activity-feed">
            <div className="activity-feed-header">
              <h3>Recent Activity</h3>
              <span style={{ fontSize: 12, color: '#6b7280' }}>{recentActivity.length} items</span>
            </div>
            {recentActivity.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#6b7280' }}>No recent activity</div>
            ) : recentActivity.map((item, i) => (
              <div key={i} className="activity-item">
                <div className="activity-icon" style={{ background: item.bg, color: item.color }}>
                  {item.icon}
                </div>
                <div className="activity-content">
                  <div className="activity-title">{item.title}</div>
                  <div className="activity-meta">{item.meta} &middot; {formatRelativeTime(item.date)}</div>
                </div>
                <div className="activity-amount" style={{ color: item.amountColor }}>
                  {item.amount}
                </div>
              </div>
            ))}
          </div>

          {/* Upcoming Deadlines */}
          <div className="activity-feed">
            <div className="activity-feed-header">
              <h3>Upcoming Deadlines</h3>
              <span style={{ fontSize: 12, color: '#6b7280' }}>{upcomingDeadlines.length} items</span>
            </div>
            {upcomingDeadlines.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#6b7280' }}>No upcoming deadlines</div>
            ) : upcomingDeadlines.map((item, i) => {
              const { day, month } = formatDate(item.date);
              return (
                <div key={i} className="deadline-item" style={{ cursor: 'pointer' }} onClick={() => navigate(item.path)}>
                  <div className="deadline-date">
                    <div className="day" style={{ color: item.overdue ? '#dc2626' : '#111827' }}>{day}</div>
                    <div className="month">{month}</div>
                  </div>
                  <div className="deadline-info">
                    <div className="title" style={{ color: item.overdue ? '#dc2626' : '#111827' }}>{item.title}</div>
                    <div className="subtitle">{item.subtitle}</div>
                  </div>
                  {item.overdue && <span className="badge badge-overdue">Overdue</span>}
                </div>
              );
            })}
          </div>
        </div>

        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, marginTop: 32, color: '#111827' }}>
          All Features ({featureCards.length})
        </h3>
        <div className="feature-cards">
          {featureCards.map((card, i) => (
            <div key={i} className={`feature-card ${card.className}`} onClick={() => navigate(card.path)}>
              <div className="card-icon">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              {card.count !== null && (
                <div className="card-count">{card.count} records</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Dashboard;
