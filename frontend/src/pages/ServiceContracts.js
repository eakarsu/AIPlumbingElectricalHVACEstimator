import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import AIOutput from '../components/AIOutput';
import { ToastContext } from '../App';

const emptyItem = {
  contractNumber: '', customerName: '', customerEmail: '', customerPhone: '',
  serviceType: 'Plumbing', description: '', startDate: '', endDate: '',
  monthlyFee: '', annualValue: '', visitsIncluded: 2, visitsUsed: 0,
  status: 'active', renewalDate: '', notes: ''
};

function ServiceContracts() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyItem);
  const [editing, setEditing] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const addToast = useContext(ToastContext);

  const fetchItems = async () => {
    try { const { data } = await api.get('/service-contracts'); setItems(data); } catch (err) { console.error(err); }
  };
  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    try {
      if (editing) { await api.put(`/service-contracts/${formData.id}`, formData); addToast('Contract updated'); }
      else {
        if (!formData.contractNumber) {
          formData.contractNumber = `SC-${new Date().getFullYear()}-${String(items.length + 1).padStart(3, '0')}`;
        }
        await api.post('/service-contracts', formData);
        addToast('Contract created');
      }
      setShowForm(false); setFormData(emptyItem); setEditing(false); fetchItems();
    } catch (err) { addToast(err.response?.data?.error || 'Failed to save', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this contract?')) return;
    try { await api.delete(`/service-contracts/${id}`); addToast('Contract deleted'); setSelected(null); fetchItems(); }
    catch (err) { addToast('Failed to delete', 'error'); }
  };

  const handleEdit = (item) => { setFormData(item); setEditing(true); setShowForm(true); setSelected(null); };

  const handleAIAnalyze = async (id) => {
    setAiLoading(true); setAiResult('');
    try {
      const { data } = await api.post(`/service-contracts/${id}/analyze`);
      setAiResult(data.analysis);
    } catch (err) { setAiResult('AI analysis failed. Please check your OpenRouter API key.'); }
    setAiLoading(false);
  };

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const totals = {
    total: items.length,
    active: items.filter(i => i.status === 'active').length,
    revenue: items.filter(i => i.status === 'active').reduce((s, i) => s + parseFloat(i.annualValue || 0), 0),
    expiring: items.filter(i => i.status === 'active' && i.endDate && new Date(i.endDate) <= thirtyDaysFromNow && new Date(i.endDate) >= now).length,
  };

  return (
    <>
      <div className="page-header">
        <div><h2>Service Contracts</h2><div className="subtitle">Manage recurring service agreements</div></div>
        <button className="btn btn-primary" onClick={() => { setFormData(emptyItem); setEditing(false); setShowForm(true); }}>+ New Contract</button>
      </div>
      <div className="page-body">
        {/* Summary Cards */}
        <div className="dashboard-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card"><div className="stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>📋</div><div className="stat-value">{totals.total}</div><div className="stat-label">Total Contracts</div></div>
          <div className="stat-card"><div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>✅</div><div className="stat-value">{totals.active}</div><div className="stat-label">Active</div></div>
          <div className="stat-card"><div className="stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}>💰</div><div className="stat-value">${totals.revenue.toLocaleString()}</div><div className="stat-label">Revenue</div></div>
          <div className="stat-card"><div className="stat-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>⏳</div><div className="stat-value">{totals.expiring}</div><div className="stat-label">Expiring Soon</div></div>
        </div>

        {selected ? (
          <>
            <div className="back-link" onClick={() => { setSelected(null); setAiResult(''); }}>← Back to list</div>
            <div className="detail-view">
              <div className="detail-header">
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700 }}>{selected.contractNumber}</h3>
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
                  <div className="detail-field"><div className="label">Customer</div><div className="value">{selected.customerName}</div></div>
                  <div className="detail-field"><div className="label">Email</div><div className="value">{selected.customerEmail || '-'}</div></div>
                  <div className="detail-field"><div className="label">Phone</div><div className="value">{selected.customerPhone || '-'}</div></div>
                  <div className="detail-field"><div className="label">Service Type</div><div className="value">{selected.serviceType}</div></div>
                  <div className="detail-field"><div className="label">Start Date</div><div className="value">{selected.startDate || '-'}</div></div>
                  <div className="detail-field"><div className="label">End Date</div><div className="value">{selected.endDate || '-'}</div></div>
                  <div className="detail-field"><div className="label">Monthly Fee</div><div className="value" style={{ fontWeight: 700, color: '#059669' }}>${parseFloat(selected.monthlyFee || 0).toLocaleString()}</div></div>
                  <div className="detail-field"><div className="label">Annual Value</div><div className="value" style={{ fontWeight: 700, color: '#059669' }}>${parseFloat(selected.annualValue || 0).toLocaleString()}</div></div>
                  <div className="detail-field"><div className="label">Renewal Date</div><div className="value">{selected.renewalDate || '-'}</div></div>
                </div>

                {/* Visits Progress */}
                <div style={{ marginTop: 24, background: '#f9fafb', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Service Visits</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>Visits Used</span>
                    <span style={{ fontWeight: 600 }}>{selected.visitsUsed} / {selected.visitsIncluded}</span>
                  </div>
                  <div style={{ background: '#e5e7eb', borderRadius: 8, height: 12, overflow: 'hidden' }}>
                    <div style={{
                      background: selected.visitsUsed >= selected.visitsIncluded ? '#dc2626' : '#059669',
                      height: '100%',
                      width: `${Math.min((selected.visitsUsed / (selected.visitsIncluded || 1)) * 100, 100)}%`,
                      borderRadius: 8,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
                    {selected.visitsIncluded - selected.visitsUsed > 0
                      ? `${selected.visitsIncluded - selected.visitsUsed} visits remaining`
                      : 'All included visits used'}
                  </div>
                </div>

                <div className="detail-field" style={{ marginTop: 16 }}><div className="label">Description</div><div className="value">{selected.description || '-'}</div></div>
                {selected.notes && <div className="detail-field" style={{ marginTop: 16 }}><div className="label">Notes</div><div className="value">{selected.notes}</div></div>}
                <AIOutput content={aiResult} loading={aiLoading} title="AI Contract Analysis" />
              </div>
            </div>
          </>
        ) : (
          <div className="data-table-container">
            <div className="table-header"><h3>All Contracts ({items.length})</h3></div>
            <table className="data-table">
              <thead><tr><th>Contract #</th><th>Customer</th><th>Service Type</th><th>Monthly Fee ($)</th><th>Visits</th><th>Status</th></tr></thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} onClick={() => setSelected(item)}>
                    <td className="title-cell">{item.contractNumber}</td>
                    <td>{item.customerName}</td>
                    <td>{item.serviceType}</td>
                    <td style={{ fontWeight: 700, color: '#059669' }}>${parseFloat(item.monthlyFee || 0).toLocaleString()}</td>
                    <td>{item.visitsUsed}/{item.visitsIncluded}</td>
                    <td><span className={`badge badge-${item.status}`}>{item.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditing(false); }} title={editing ? 'Edit Contract' : 'New Contract'}
          footer={<><button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>{editing ? 'Update' : 'Create'}</button></>}>
          <div className="form-row">
            <div className="form-group"><label>Contract Number</label><input className="form-control" value={formData.contractNumber} onChange={e => setFormData({...formData, contractNumber: e.target.value})} placeholder="Auto-generated if empty" /></div>
            <div className="form-group"><label>Status</label><select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}><option value="active">Active</option><option value="expired">Expired</option><option value="cancelled">Cancelled</option><option value="pending">Pending</option></select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Customer Name *</label><input className="form-control" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} /></div>
            <div className="form-group"><label>Customer Email</label><input className="form-control" type="email" value={formData.customerEmail} onChange={e => setFormData({...formData, customerEmail: e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Customer Phone</label><input className="form-control" value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} /></div>
            <div className="form-group"><label>Service Type</label><select className="form-control" value={formData.serviceType} onChange={e => setFormData({...formData, serviceType: e.target.value})}><option value="Plumbing">Plumbing</option><option value="Electrical">Electrical</option><option value="HVAC">HVAC</option><option value="Comprehensive">Comprehensive</option></select></div>
          </div>
          <div className="form-group"><label>Description</label><textarea className="form-control" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
          <div className="form-row">
            <div className="form-group"><label>Start Date</label><input className="form-control" type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} /></div>
            <div className="form-group"><label>End Date</label><input className="form-control" type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Monthly Fee ($)</label><input className="form-control" type="number" step="0.01" value={formData.monthlyFee} onChange={e => setFormData({...formData, monthlyFee: e.target.value})} /></div>
            <div className="form-group"><label>Annual Value ($)</label><input className="form-control" type="number" step="0.01" value={formData.annualValue} onChange={e => setFormData({...formData, annualValue: e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Visits Included</label><input className="form-control" type="number" value={formData.visitsIncluded} onChange={e => setFormData({...formData, visitsIncluded: e.target.value})} /></div>
            <div className="form-group"><label>Visits Used</label><input className="form-control" type="number" value={formData.visitsUsed} onChange={e => setFormData({...formData, visitsUsed: e.target.value})} /></div>
          </div>
          <div className="form-group"><label>Renewal Date</label><input className="form-control" type="date" value={formData.renewalDate} onChange={e => setFormData({...formData, renewalDate: e.target.value})} /></div>
          <div className="form-group"><label>Notes</label><textarea className="form-control" rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
        </Modal>
      </div>
    </>
  );
}

export default ServiceContracts;
