import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import AIOutput from '../components/AIOutput';
import { ToastContext } from '../App';

const emptyItem = {
  name: '', category: 'Tools', description: '', serialNumber: '', purchaseDate: '',
  purchaseCost: '', currentValue: '', condition: 'good', location: '',
  assignedTo: '', nextMaintenanceDate: '', status: 'available', notes: ''
};

function Equipment() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyItem);
  const [editing, setEditing] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const addToast = useContext(ToastContext);

  const fetchItems = async () => {
    try { const { data } = await api.get('/equipment'); setItems(data); } catch (err) { console.error(err); }
  };
  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    try {
      if (editing) {
        await api.put(`/equipment/${formData.id}`, formData);
        addToast('Equipment updated');
      } else {
        await api.post('/equipment', formData);
        addToast('Equipment created');
      }
      setShowForm(false); setFormData(emptyItem); setEditing(false); fetchItems();
    } catch (err) { addToast(err.response?.data?.error || 'Failed to save', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this equipment?')) return;
    try { await api.delete(`/equipment/${id}`); addToast('Equipment deleted'); setSelected(null); fetchItems(); }
    catch (err) { addToast('Failed to delete', 'error'); }
  };

  const handleEdit = (item) => { setFormData(item); setEditing(true); setShowForm(true); setSelected(null); };

  const handleAIAnalyze = async () => {
    setAiLoading(true); setAiResult('');
    try {
      const { data } = await api.post('/equipment/ai/analyze');
      setAiResult(data.analysis);
    } catch (err) { setAiResult('AI analysis failed. Please check your OpenRouter API key.'); }
    setAiLoading(false);
  };

  const conditionBadge = (condition) => {
    const colors = { excellent: '#059669', good: '#2563eb', fair: '#d97706', poor: '#dc2626' };
    const bg = { excellent: '#d1fae5', good: '#dbeafe', fair: '#fef3c7', poor: '#fee2e2' };
    return <span className="badge" style={{ background: bg[condition] || '#e5e7eb', color: colors[condition] || '#374151' }}>{condition}</span>;
  };

  const statusBadge = (status) => {
    const map = {
      available: { bg: '#d1fae5', color: '#059669', label: 'Available' },
      in_use: { bg: '#dbeafe', color: '#2563eb', label: 'In Use' },
      maintenance: { bg: '#fef3c7', color: '#d97706', label: 'Maintenance' },
      retired: { bg: '#fee2e2', color: '#dc2626', label: 'Retired' }
    };
    const s = map[status] || { bg: '#e5e7eb', color: '#374151', label: status };
    return <span className="badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>;
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Equipment Management</h2>
          <div className="subtitle">Track tools, vehicles, and equipment</div>
        </div>
        <div className="btn-group">
          <button className="btn btn-ai" onClick={handleAIAnalyze} disabled={aiLoading}>
            🧠 AI Analyze
          </button>
          <button className="btn btn-primary" onClick={() => { setFormData(emptyItem); setEditing(false); setShowForm(true); }}>+ New Equipment</button>
        </div>
      </div>
      <div className="page-body">
        <AIOutput content={aiResult} loading={aiLoading} title="AI Equipment Analysis" />

        {selected ? (
          <>
            <div className="back-link" onClick={() => setSelected(null)}>← Back to list</div>
            <div className="detail-view">
              <div className="detail-header">
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700 }}>{selected.name}</h3>
                  <span className="badge" style={{ background: '#e0e7ff', color: '#3730a3' }}>{selected.category}</span>
                  {' '}{conditionBadge(selected.condition)}{' '}{statusBadge(selected.status)}
                </div>
                <div className="btn-group">
                  <button className="btn btn-secondary" onClick={() => handleEdit(selected)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(selected.id)}>Delete</button>
                </div>
              </div>
              <div className="detail-body">
                <div className="detail-grid">
                  <div className="detail-field"><div className="label">Category</div><div className="value">{selected.category}</div></div>
                  <div className="detail-field"><div className="label">Serial Number</div><div className="value">{selected.serialNumber || '-'}</div></div>
                  <div className="detail-field"><div className="label">Purchase Date</div><div className="value">{selected.purchaseDate || '-'}</div></div>
                  <div className="detail-field"><div className="label">Purchase Cost</div><div className="value" style={{ fontSize: 20, fontWeight: 700, color: '#059669' }}>${parseFloat(selected.purchaseCost || 0).toFixed(2)}</div></div>
                  <div className="detail-field"><div className="label">Current Value</div><div className="value" style={{ fontSize: 20, fontWeight: 700, color: '#2563eb' }}>${parseFloat(selected.currentValue || 0).toFixed(2)}</div></div>
                  <div className="detail-field">
                    <div className="label">Depreciation</div>
                    <div className="value" style={{ fontSize: 20, fontWeight: 700, color: '#dc2626' }}>
                      ${(parseFloat(selected.purchaseCost || 0) - parseFloat(selected.currentValue || 0)).toFixed(2)}
                    </div>
                  </div>
                  <div className="detail-field"><div className="label">Condition</div><div className="value">{conditionBadge(selected.condition)}</div></div>
                  <div className="detail-field"><div className="label">Location</div><div className="value">{selected.location || '-'}</div></div>
                  <div className="detail-field"><div className="label">Assigned To</div><div className="value">{selected.assignedTo || '-'}</div></div>
                  <div className="detail-field"><div className="label">Status</div><div className="value">{statusBadge(selected.status)}</div></div>
                  <div className="detail-field"><div className="label">Next Maintenance</div><div className="value">{selected.nextMaintenanceDate || '-'}</div></div>
                </div>
                {selected.description && (
                  <div className="detail-field" style={{ marginTop: 16 }}>
                    <div className="label">Description</div>
                    <div className="value">{selected.description}</div>
                  </div>
                )}
                {selected.notes && (
                  <div className="detail-field" style={{ marginTop: 16 }}>
                    <div className="label">Notes</div>
                    <div className="value">{selected.notes}</div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="data-table-container">
            <div className="table-header"><h3>All Equipment ({items.length})</h3></div>
            <table className="data-table">
              <thead><tr><th>Name</th><th>Category</th><th>Condition</th><th>Location</th><th>Assigned To</th><th>Status</th><th>Value ($)</th></tr></thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} onClick={() => setSelected(item)}>
                    <td className="title-cell">{item.name}</td>
                    <td>{item.category}</td>
                    <td>{conditionBadge(item.condition)}</td>
                    <td>{item.location || '-'}</td>
                    <td>{item.assignedTo || '-'}</td>
                    <td>{statusBadge(item.status)}</td>
                    <td style={{ fontWeight: 600 }}>${parseFloat(item.currentValue || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditing(false); }} title={editing ? 'Edit Equipment' : 'New Equipment'}
          footer={<><button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>{editing ? 'Update' : 'Create'}</button></>}>
          <div className="form-row">
            <div className="form-group"><label>Name *</label><input className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
            <div className="form-group"><label>Category *</label>
              <select className="form-control" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option>Tools</option><option>Vehicles</option><option>Safety</option><option>Diagnostic</option><option>Heavy Equipment</option>
              </select>
            </div>
          </div>
          <div className="form-group"><label>Description</label><textarea className="form-control" rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
          <div className="form-row">
            <div className="form-group"><label>Serial Number</label><input className="form-control" value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})} /></div>
            <div className="form-group"><label>Purchase Date</label><input className="form-control" type="date" value={formData.purchaseDate} onChange={e => setFormData({...formData, purchaseDate: e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Purchase Cost ($)</label><input className="form-control" type="number" step="0.01" value={formData.purchaseCost} onChange={e => setFormData({...formData, purchaseCost: e.target.value})} /></div>
            <div className="form-group"><label>Current Value ($)</label><input className="form-control" type="number" step="0.01" value={formData.currentValue} onChange={e => setFormData({...formData, currentValue: e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Condition *</label>
              <select className="form-control" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}>
                <option value="excellent">Excellent</option><option value="good">Good</option><option value="fair">Fair</option><option value="poor">Poor</option>
              </select>
            </div>
            <div className="form-group"><label>Status *</label>
              <select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="available">Available</option><option value="in_use">In Use</option><option value="maintenance">Maintenance</option><option value="retired">Retired</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Location</label><input className="form-control" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} /></div>
            <div className="form-group"><label>Assigned To</label><input className="form-control" value={formData.assignedTo} onChange={e => setFormData({...formData, assignedTo: e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Next Maintenance Date</label><input className="form-control" type="date" value={formData.nextMaintenanceDate} onChange={e => setFormData({...formData, nextMaintenanceDate: e.target.value})} /></div>
          </div>
          <div className="form-group"><label>Notes</label><textarea className="form-control" rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
        </Modal>
      </div>
    </>
  );
}

export default Equipment;
