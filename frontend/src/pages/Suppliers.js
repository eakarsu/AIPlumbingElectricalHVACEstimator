import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import AIOutput from '../components/AIOutput';
import { ToastContext } from '../App';

const emptyItem = {
  name: '', contactPerson: '', email: '', phone: '', address: '', website: '',
  category: 'General', accountNumber: '', paymentTerms: 'Net 30', rating: 5,
  leadTimeDays: 3, minimumOrder: '', status: 'active', notes: ''
};

function Suppliers() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyItem);
  const [editing, setEditing] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const addToast = useContext(ToastContext);

  const fetchItems = async () => {
    try { const { data } = await api.get('/suppliers'); setItems(data); } catch (err) { console.error(err); }
  };
  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    try {
      if (editing) {
        await api.put(`/suppliers/${formData.id}`, formData);
        addToast('Supplier updated');
      } else {
        await api.post('/suppliers', formData);
        addToast('Supplier created');
      }
      setShowForm(false); setFormData(emptyItem); setEditing(false); fetchItems();
    } catch (err) { addToast(err.response?.data?.error || 'Failed to save', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this supplier?')) return;
    try { await api.delete(`/suppliers/${id}`); addToast('Supplier deleted'); setSelected(null); fetchItems(); }
    catch (err) { addToast('Failed to delete', 'error'); }
  };

  const handleEdit = (item) => { setFormData(item); setEditing(true); setShowForm(true); setSelected(null); };

  const handleAIAnalyze = async () => {
    setAiLoading(true); setAiResult('');
    try {
      const { data } = await api.post('/suppliers/ai/analyze', { supplierData: selected });
      setAiResult(data.analysis);
    } catch (err) { setAiResult('AI analysis failed. Please check your OpenRouter API key.'); }
    setAiLoading(false);
  };

  const renderStars = (rating) => {
    const count = Math.round(rating || 0);
    return '★'.repeat(count) + '☆'.repeat(5 - count);
  };

  const statusBadge = (status) => {
    const colors = { active: { bg: '#d1fae5', color: '#065f46' }, inactive: { bg: '#e5e7eb', color: '#374151' }, preferred: { bg: '#dbeafe', color: '#1e40af' } };
    const c = colors[status] || colors.active;
    return <span className="badge" style={{ background: c.bg, color: c.color }}>{status}</span>;
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Supplier Management</h2>
          <div className="subtitle">Manage vendors and supply chain</div>
        </div>
        <div className="btn-group">
          <button className="btn btn-primary" onClick={() => { setFormData(emptyItem); setEditing(false); setShowForm(true); }}>+ New Supplier</button>
        </div>
      </div>
      <div className="page-body">
        {selected ? (
          <>
            <div className="back-link" onClick={() => { setSelected(null); setAiResult(''); }}>← Back to list</div>
            <div className="detail-view">
              <div className="detail-header">
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700 }}>{selected.name}</h3>
                  <span className="badge" style={{ background: '#e0e7ff', color: '#3730a3' }}>{selected.category}</span>
                  {' '}
                  {statusBadge(selected.status)}
                  {' '}
                  <span style={{ color: '#f59e0b', fontSize: 16 }}>{renderStars(selected.rating)}</span>
                </div>
                <div className="btn-group">
                  <button className="btn btn-ai" onClick={handleAIAnalyze} disabled={aiLoading}>🧠 AI Analyze Supplier</button>
                  <button className="btn btn-secondary" onClick={() => handleEdit(selected)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(selected.id)}>Delete</button>
                </div>
              </div>
              <div className="detail-body">
                <div className="detail-grid">
                  <div className="detail-field"><div className="label">Contact Person</div><div className="value">{selected.contactPerson || '-'}</div></div>
                  <div className="detail-field"><div className="label">Email</div><div className="value">{selected.email || '-'}</div></div>
                  <div className="detail-field"><div className="label">Phone</div><div className="value">{selected.phone || '-'}</div></div>
                  <div className="detail-field"><div className="label">Address</div><div className="value">{selected.address || '-'}</div></div>
                  <div className="detail-field"><div className="label">Website</div><div className="value">{selected.website || '-'}</div></div>
                  <div className="detail-field"><div className="label">Category</div><div className="value">{selected.category}</div></div>
                  <div className="detail-field"><div className="label">Account Number</div><div className="value">{selected.accountNumber || '-'}</div></div>
                  <div className="detail-field"><div className="label">Payment Terms</div><div className="value">{selected.paymentTerms}</div></div>
                  <div className="detail-field"><div className="label">Rating</div><div className="value" style={{ color: '#f59e0b', fontSize: 18 }}>{renderStars(selected.rating)}</div></div>
                  <div className="detail-field"><div className="label">Lead Time (Days)</div><div className="value">{selected.leadTimeDays || '-'}</div></div>
                  <div className="detail-field"><div className="label">Minimum Order</div><div className="value">{selected.minimumOrder ? `$${parseFloat(selected.minimumOrder).toLocaleString()}` : '-'}</div></div>
                  <div className="detail-field"><div className="label">Status</div><div className="value">{statusBadge(selected.status)}</div></div>
                </div>
                {selected.notes && (
                  <div className="detail-field" style={{ marginTop: 16 }}>
                    <div className="label">Notes</div>
                    <div className="value">{selected.notes}</div>
                  </div>
                )}
                <AIOutput content={aiResult} loading={aiLoading} title="AI Supplier Analysis" />
              </div>
            </div>
          </>
        ) : (
          <div className="data-table-container">
            <div className="table-header"><h3>All Suppliers ({items.length})</h3></div>
            <table className="data-table">
              <thead><tr><th>Name</th><th>Category</th><th>Contact Person</th><th>Phone</th><th>Payment Terms</th><th>Rating</th><th>Status</th></tr></thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} onClick={() => setSelected(item)}>
                    <td className="title-cell">{item.name}</td>
                    <td>{item.category}</td>
                    <td>{item.contactPerson}</td>
                    <td>{item.phone}</td>
                    <td>{item.paymentTerms}</td>
                    <td style={{ color: '#f59e0b' }}>{renderStars(item.rating)}</td>
                    <td>{statusBadge(item.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditing(false); }} title={editing ? 'Edit Supplier' : 'New Supplier'}
          footer={<><button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>{editing ? 'Update' : 'Create'}</button></>}>
          <div className="form-row">
            <div className="form-group"><label>Name *</label><input className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
            <div className="form-group"><label>Contact Person</label><input className="form-control" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Email</label><input className="form-control" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
            <div className="form-group"><label>Phone</label><input className="form-control" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
          </div>
          <div className="form-group"><label>Address</label><input className="form-control" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
          <div className="form-row">
            <div className="form-group"><label>Website</label><input className="form-control" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} /></div>
            <div className="form-group"><label>Account Number</label><input className="form-control" value={formData.accountNumber} onChange={e => setFormData({...formData, accountNumber: e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Category</label>
              <select className="form-control" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="Plumbing">Plumbing</option><option value="Electrical">Electrical</option><option value="HVAC">HVAC</option><option value="General">General</option>
              </select>
            </div>
            <div className="form-group"><label>Status</label>
              <select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="active">Active</option><option value="inactive">Inactive</option><option value="preferred">Preferred</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Payment Terms</label>
              <select className="form-control" value={formData.paymentTerms} onChange={e => setFormData({...formData, paymentTerms: e.target.value})}>
                <option value="COD">COD</option><option value="Net 15">Net 15</option><option value="Net 30">Net 30</option><option value="Net 45">Net 45</option><option value="Net 60">Net 60</option><option value="Prepaid">Prepaid</option>
              </select>
            </div>
            <div className="form-group"><label>Rating (1-5)</label><input className="form-control" type="number" min="1" max="5" value={formData.rating} onChange={e => setFormData({...formData, rating: e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Lead Time (Days)</label><input className="form-control" type="number" min="0" value={formData.leadTimeDays} onChange={e => setFormData({...formData, leadTimeDays: e.target.value})} /></div>
            <div className="form-group"><label>Minimum Order ($)</label><input className="form-control" type="number" step="0.01" value={formData.minimumOrder} onChange={e => setFormData({...formData, minimumOrder: e.target.value})} /></div>
          </div>
          <div className="form-group"><label>Notes</label><textarea className="form-control" rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
        </Modal>
      </div>
    </>
  );
}

export default Suppliers;
