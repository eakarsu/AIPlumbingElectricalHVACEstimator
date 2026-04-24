import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import AIOutput from '../components/AIOutput';
import { ToastContext } from '../App';

const emptyItem = {
  title: '', customerName: '', customerPhone: '', productName: '', serialNumber: '',
  warrantyType: 'manufacturer', startDate: '', endDate: '', coverage: '', status: 'active',
  claimHistory: '', notes: ''
};

function Warranties() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyItem);
  const [editing, setEditing] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDesc, setAiDesc] = useState('');
  const addToast = useContext(ToastContext);

  const fetchItems = async () => {
    try { const { data } = await api.get('/warranties'); setItems(data); } catch (err) { console.error(err); }
  };
  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    try {
      if (editing) { await api.put(`/warranties/${formData.id}`, formData); addToast('Warranty updated'); }
      else { await api.post('/warranties', formData); addToast('Warranty created'); }
      setShowForm(false); setFormData(emptyItem); setEditing(false); fetchItems();
    } catch (err) { addToast(err.response?.data?.error || 'Failed to save', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this warranty?')) return;
    try { await api.delete(`/warranties/${id}`); addToast('Warranty deleted'); setSelected(null); fetchItems(); }
    catch (err) { addToast('Failed to delete', 'error'); }
  };

  const handleEdit = (item) => { setFormData(item); setEditing(true); setShowForm(true); setSelected(null); };

  const handleAIAnalyze = async () => {
    if (!aiDesc) return;
    setAiLoading(true); setAiResult('');
    try {
      const { data } = await api.post('/warranties/ai/analyze', { description: aiDesc });
      setAiResult(data.analysis);
    } catch (err) { setAiResult('AI analysis failed. Please check your OpenRouter API key.'); }
    setAiLoading(false);
  };

  const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const today = new Date();
    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const statusBadge = (status) => {
    const colors = { active: 'green', expired: 'red', claimed: 'yellow' };
    const color = colors[status] || 'gray';
    return <span className={`badge badge-${color}`} style={{ background: color === 'green' ? '#dcfce7' : color === 'red' ? '#fee2e2' : color === 'yellow' ? '#fef9c3' : '#f3f4f6', color: color === 'green' ? '#166534' : color === 'red' ? '#991b1b' : color === 'yellow' ? '#854d0e' : '#374151', padding: '2px 8px', borderRadius: 9999, fontSize: 12, fontWeight: 600 }}>{status}</span>;
  };

  const typeBadge = (type) => {
    return <span style={{ background: '#ede9fe', color: '#5b21b6', padding: '2px 8px', borderRadius: 9999, fontSize: 12, fontWeight: 600 }}>{type}</span>;
  };

  return (
    <>
      <div className="page-header">
        <div><h2>Warranty Tracking</h2><div className="subtitle">Track product and labor warranties</div></div>
        <button className="btn btn-primary" onClick={() => { setFormData(emptyItem); setEditing(false); setShowForm(true); }}>+ New Warranty</button>
      </div>
      <div className="page-body">
        {/* AI Warranty Analyzer */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>AI Warranty Analyzer</h3>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}><label>Warranty Description</label><textarea className="form-control" rows={3} value={aiDesc} onChange={e => setAiDesc(e.target.value)} placeholder="Describe the warranty situation to analyze..." /></div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn btn-ai" onClick={handleAIAnalyze} disabled={!aiDesc || aiLoading}>Analyze Warranty</button>
            </div>
          </div>
          <AIOutput content={aiResult} loading={aiLoading} title="AI Warranty Analysis" />
        </div>

        {selected ? (
          <>
            <div className="back-link" onClick={() => setSelected(null)}>← Back to list</div>
            <div className="detail-view">
              <div className="detail-header">
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700 }}>{selected.title}</h3>
                  {statusBadge(selected.status)}
                  {' '}
                  {typeBadge(selected.warrantyType)}
                  {(() => {
                    const days = getDaysRemaining(selected.endDate);
                    if (days !== null) {
                      return <span style={{ fontSize: 13, color: days > 0 ? '#166534' : '#991b1b', fontWeight: 600, marginLeft: 8 }}>
                        {days > 0 ? `${days} days remaining` : `Expired ${Math.abs(days)} days ago`}
                      </span>;
                    }
                    return null;
                  })()}
                </div>
                <div className="btn-group">
                  <button className="btn btn-secondary" onClick={() => handleEdit(selected)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(selected.id)}>Delete</button>
                </div>
              </div>
              <div className="detail-body">
                <div className="detail-grid">
                  <div className="detail-field"><div className="label">Customer Name</div><div className="value">{selected.customerName || '-'}</div></div>
                  <div className="detail-field"><div className="label">Customer Phone</div><div className="value">{selected.customerPhone || '-'}</div></div>
                  <div className="detail-field"><div className="label">Product Name</div><div className="value">{selected.productName || '-'}</div></div>
                  <div className="detail-field"><div className="label">Serial Number</div><div className="value">{selected.serialNumber || '-'}</div></div>
                  <div className="detail-field"><div className="label">Warranty Type</div><div className="value">{typeBadge(selected.warrantyType)}</div></div>
                  <div className="detail-field"><div className="label">Status</div><div className="value">{statusBadge(selected.status)}</div></div>
                  <div className="detail-field"><div className="label">Start Date</div><div className="value">{selected.startDate || '-'}</div></div>
                  <div className="detail-field"><div className="label">End Date</div><div className="value">{selected.endDate || '-'}</div></div>
                </div>
                <div className="detail-field" style={{ marginTop: 16 }}><div className="label">Coverage</div><div className="value">{selected.coverage || '-'}</div></div>
                {selected.claimHistory && <div className="detail-field" style={{ marginTop: 16 }}><div className="label">Claim History</div><div className="value" style={{ lineHeight: 1.8 }}>{selected.claimHistory}</div></div>}
                {selected.notes && <div className="detail-field" style={{ marginTop: 16 }}><div className="label">Notes</div><div className="value">{selected.notes}</div></div>}
              </div>
            </div>
          </>
        ) : (
          <div className="data-table-container">
            <div className="table-header"><h3>All Warranties ({items.length})</h3></div>
            <table className="data-table">
              <thead><tr><th>Title</th><th>Customer</th><th>Product</th><th>Type</th><th>End Date</th><th>Status</th></tr></thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} onClick={() => setSelected(item)}>
                    <td className="title-cell">{item.title}</td>
                    <td>{item.customerName}</td>
                    <td>{item.productName}</td>
                    <td>{typeBadge(item.warrantyType)}</td>
                    <td>{item.endDate || '-'}</td>
                    <td>{statusBadge(item.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditing(false); }} title={editing ? 'Edit Warranty' : 'New Warranty'}
          footer={<><button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>{editing ? 'Update' : 'Create'}</button></>}>
          <div className="form-row">
            <div className="form-group"><label>Title *</label><input className="form-control" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
            <div className="form-group"><label>Product Name</label><input className="form-control" value={formData.productName} onChange={e => setFormData({...formData, productName: e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Customer Name</label><input className="form-control" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} /></div>
            <div className="form-group"><label>Customer Phone</label><input className="form-control" value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Serial Number</label><input className="form-control" value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})} /></div>
            <div className="form-group"><label>Warranty Type</label>
              <select className="form-control" value={formData.warrantyType} onChange={e => setFormData({...formData, warrantyType: e.target.value})}>
                <option value="manufacturer">Manufacturer</option><option value="extended">Extended</option><option value="labor">Labor</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Start Date</label><input className="form-control" type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} /></div>
            <div className="form-group"><label>End Date</label><input className="form-control" type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Status</label>
              <select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="active">Active</option><option value="expired">Expired</option><option value="claimed">Claimed</option>
              </select>
            </div>
          </div>
          <div className="form-group"><label>Coverage</label><textarea className="form-control" rows={2} value={formData.coverage} onChange={e => setFormData({...formData, coverage: e.target.value})} placeholder="What is covered under this warranty..." /></div>
          <div className="form-group"><label>Claim History</label><textarea className="form-control" rows={2} value={formData.claimHistory} onChange={e => setFormData({...formData, claimHistory: e.target.value})} /></div>
          <div className="form-group"><label>Notes</label><textarea className="form-control" rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
        </Modal>
      </div>
    </>
  );
}

export default Warranties;
