import React, { useState, useEffect, useContext, useMemo } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import AIOutput from '../components/AIOutput';
import SearchFilter from '../components/SearchFilter';
import { ToastContext } from '../App';

const emptyItem = {
  title: '', category: 'Materials', description: '', amount: '', date: '', vendor: '',
  receiptNumber: '', paymentMethod: 'credit_card', isReimbursable: false, projectName: '', status: 'pending', notes: ''
};

const categoryOptions = ['Materials', 'Labor', 'Equipment', 'Fuel', 'Insurance', 'Permits', 'Office', 'Other'];
const paymentMethodOptions = [
  { value: 'credit_card', label: 'Credit Card' }, { value: 'company_card', label: 'Company Card' },
  { value: 'check', label: 'Check' }, { value: 'cash', label: 'Cash' }, { value: 'bank_transfer', label: 'Bank Transfer' }
];

function Expenses() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyItem);
  const [editing, setEditing] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const addToast = useContext(ToastContext);

  const filteredItems = useMemo(() => {
    let result = items.filter(item => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = !search ||
        item.title?.toLowerCase().includes(search) ||
        item.vendor?.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search) ||
        item.projectName?.toLowerCase().includes(search);
      const matchesCategory = !filterCategory || item.category === filterCategory;
      const matchesStatus = !filterStatus || item.status === filterStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest': return new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0);
        case 'oldest': return new Date(a.date || a.createdAt || 0) - new Date(b.date || b.createdAt || 0);
        case 'amount-high': return parseFloat(b.amount || 0) - parseFloat(a.amount || 0);
        case 'amount-low': return parseFloat(a.amount || 0) - parseFloat(b.amount || 0);
        default: return 0;
      }
    });
    return result;
  }, [items, searchTerm, filterCategory, filterStatus, sortBy]);

  const fetchItems = async () => {
    try { const { data } = await api.get('/expenses'); setItems(data); } catch (err) { console.error(err); }
  };
  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    try {
      if (editing) { await api.put(`/expenses/${formData.id}`, formData); addToast('Expense updated'); }
      else { await api.post('/expenses', formData); addToast('Expense created'); }
      setShowForm(false); setFormData(emptyItem); setEditing(false); fetchItems();
    } catch (err) { addToast(err.response?.data?.error || 'Failed to save', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try { await api.delete(`/expenses/${id}`); addToast('Expense deleted'); setSelected(null); fetchItems(); }
    catch (err) { addToast('Failed to delete', 'error'); }
  };

  const handleEdit = (item) => { setFormData(item); setEditing(true); setShowForm(true); setSelected(null); };

  const handleAIAnalyze = async (id) => {
    setAiLoading(true); setAiResult('');
    try {
      const { data } = await api.post(`/expenses/${id}/analyze`);
      setAiResult(data.analysis);
    } catch (err) { setAiResult('AI analysis failed. Please check your OpenRouter API key.'); }
    setAiLoading(false);
  };

  const totals = {
    total: items.reduce((s, i) => s + parseFloat(i.amount || 0), 0),
    approved: items.filter(i => i.status === 'approved').reduce((s, i) => s + parseFloat(i.amount || 0), 0),
    pending: items.filter(i => i.status === 'pending').reduce((s, i) => s + parseFloat(i.amount || 0), 0),
  };

  // Category breakdown - top 3
  const categoryTotals = {};
  items.forEach(i => {
    const cat = i.category || 'Other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + parseFloat(i.amount || 0);
  });
  const topCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const paymentLabel = (val) => (paymentMethodOptions.find(o => o.value === val) || {}).label || val;

  return (
    <>
      <div className="page-header">
        <div><h2>Expense Tracking</h2><div className="subtitle">Track and optimize business expenses</div></div>
        <div className="btn-group">
          <button className="btn btn-ai" onClick={() => { if (selected) handleAIAnalyze(selected.id); else addToast('Select an expense first', 'error'); }}>🤖 AI Expense Analysis</button>
          <button className="btn btn-primary" onClick={() => { setFormData(emptyItem); setEditing(false); setShowForm(true); }}>+ New Expense</button>
        </div>
      </div>
      <div className="page-body">
        {/* Expense Summary */}
        <div className="dashboard-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card"><div className="stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>💰</div><div className="stat-value">${totals.total.toLocaleString()}</div><div className="stat-label">Total Expenses</div></div>
          <div className="stat-card"><div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>✅</div><div className="stat-value">${totals.approved.toLocaleString()}</div><div className="stat-label">Approved</div></div>
          <div className="stat-card"><div className="stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}>⏳</div><div className="stat-value">${totals.pending.toLocaleString()}</div><div className="stat-label">Pending</div></div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>📊</div>
            <div className="stat-value" style={{ fontSize: 14 }}>
              {topCategories.length > 0 ? topCategories.map(([cat, amt]) => (
                <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span>{cat}</span><span style={{ fontWeight: 700 }}>${amt.toLocaleString()}</span>
                </div>
              )) : <span style={{ fontSize: 16 }}>-</span>}
            </div>
            <div className="stat-label">Top Categories</div>
          </div>
        </div>

        {selected ? (
          <>
            <div className="back-link" onClick={() => { setSelected(null); setAiResult(''); }}>← Back to list</div>
            <div className="detail-view">
              <div className="detail-header">
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700 }}>{selected.title}</h3>
                  <span className={`badge badge-${selected.status}`}>{selected.status}</span>
                </div>
                <div className="btn-group">
                  <button className="btn btn-ai" onClick={() => handleAIAnalyze(selected.id)}>📈 AI Analyze</button>
                  <button className="btn btn-secondary" onClick={() => handleEdit(selected)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(selected.id)}>Delete</button>
                </div>
              </div>
              <div className="detail-body">
                <div className="detail-grid">
                  <div className="detail-field"><div className="label">Category</div><div className="value">{selected.category}</div></div>
                  <div className="detail-field"><div className="label">Amount</div><div className="value" style={{ fontWeight: 700, color: '#059669' }}>${parseFloat(selected.amount || 0).toLocaleString()}</div></div>
                  <div className="detail-field"><div className="label">Date</div><div className="value">{selected.date || '-'}</div></div>
                  <div className="detail-field"><div className="label">Vendor</div><div className="value">{selected.vendor || '-'}</div></div>
                  <div className="detail-field"><div className="label">Receipt Number</div><div className="value">{selected.receiptNumber || '-'}</div></div>
                  <div className="detail-field"><div className="label">Payment Method</div><div className="value">{paymentLabel(selected.paymentMethod)}</div></div>
                  <div className="detail-field"><div className="label">Reimbursable</div><div className="value">{selected.isReimbursable ? 'Yes' : 'No'}</div></div>
                  <div className="detail-field"><div className="label">Project</div><div className="value">{selected.projectName || '-'}</div></div>
                </div>
                {selected.description && <div className="detail-field" style={{ marginTop: 16 }}><div className="label">Description</div><div className="value">{selected.description}</div></div>}
                {selected.notes && <div className="detail-field" style={{ marginTop: 16 }}><div className="label">Notes</div><div className="value">{selected.notes}</div></div>}
                <AIOutput content={aiResult} loading={aiLoading} title="AI Expense Analysis" />
              </div>
            </div>
          </>
        ) : (
          <div className="data-table-container">
            <SearchFilter
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filters={[
                { label: 'All Categories', value: filterCategory, onChange: setFilterCategory, options: categoryOptions.map(c => ({ value: c, label: c })) },
                { label: 'All Statuses', value: filterStatus, onChange: setFilterStatus, options: [
                  { value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' }, { value: 'reimbursed', label: 'Reimbursed' }
                ]}
              ]}
              sortOptions={[
                { value: 'newest', label: 'Newest First' }, { value: 'oldest', label: 'Oldest First' },
                { value: 'amount-high', label: 'Amount: High to Low' }, { value: 'amount-low', label: 'Amount: Low to High' }
              ]}
              sortValue={sortBy}
              onSortChange={setSortBy}
              resultCount={filteredItems.length}
              totalCount={items.length}
            />
            <div className="table-header"><h3>Expenses ({filteredItems.length})</h3></div>
            <table className="data-table">
              <thead><tr><th>Title</th><th>Category</th><th>Amount</th><th>Date</th><th>Vendor</th><th>Status</th></tr></thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>No expenses match your search</td></tr>
                ) : filteredItems.map(item => (
                  <tr key={item.id} onClick={() => setSelected(item)}>
                    <td className="title-cell">{item.title}</td>
                    <td>{item.category}</td>
                    <td style={{ fontWeight: 700, color: '#059669' }}>${parseFloat(item.amount || 0).toLocaleString()}</td>
                    <td>{item.date}</td>
                    <td>{item.vendor || '-'}</td>
                    <td><span className={`badge badge-${item.status}`}>{item.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditing(false); }} title={editing ? 'Edit Expense' : 'New Expense'}
          footer={<><button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>{editing ? 'Update' : 'Create'}</button></>}>
          <div className="form-row">
            <div className="form-group"><label>Title *</label><input className="form-control" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
            <div className="form-group"><label>Category</label><select className="form-control" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>{categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          </div>
          <div className="form-group"><label>Description</label><textarea className="form-control" rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
          <div className="form-row">
            <div className="form-group"><label>Amount ($) *</label><input className="form-control" type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} /></div>
            <div className="form-group"><label>Date</label><input className="form-control" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Vendor</label><input className="form-control" value={formData.vendor} onChange={e => setFormData({...formData, vendor: e.target.value})} /></div>
            <div className="form-group"><label>Receipt Number</label><input className="form-control" value={formData.receiptNumber} onChange={e => setFormData({...formData, receiptNumber: e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Payment Method</label><select className="form-control" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>{paymentMethodOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
            <div className="form-group"><label>Status</label><select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="reimbursed">Reimbursed</option></select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Project Name</label><input className="form-control" value={formData.projectName} onChange={e => setFormData({...formData, projectName: e.target.value})} /></div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 24 }}>
              <input type="checkbox" checked={formData.isReimbursable} onChange={e => setFormData({...formData, isReimbursable: e.target.checked})} />
              <label style={{ margin: 0 }}>Reimbursable</label>
            </div>
          </div>
          <div className="form-group"><label>Notes</label><textarea className="form-control" rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
        </Modal>
      </div>
    </>
  );
}

export default Expenses;
