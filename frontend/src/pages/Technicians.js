import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import AIOutput from '../components/AIOutput';
import { ToastContext } from '../App';

const emptyItem = {
  name: '', email: '', phone: '', specialty: 'Plumbing', certifications: '', hourlyRate: '',
  status: 'active', hireDate: '', address: '', emergencyContact: '', notes: '', rating: 5, jobsCompleted: 0
};

function Technicians() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyItem);
  const [editing, setEditing] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const addToast = useContext(ToastContext);

  const fetchItems = async () => {
    try { const { data } = await api.get('/technicians'); setItems(data); } catch (err) { console.error(err); }
  };
  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    try {
      if (editing) { await api.put(`/technicians/${formData.id}`, formData); addToast('Technician updated'); }
      else { await api.post('/technicians', formData); addToast('Technician created'); }
      setShowForm(false); setFormData(emptyItem); setEditing(false); fetchItems();
    } catch (err) { addToast(err.response?.data?.error || 'Failed to save', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this technician?')) return;
    try { await api.delete(`/technicians/${id}`); addToast('Technician deleted'); setSelected(null); fetchItems(); }
    catch (err) { addToast('Failed to delete', 'error'); }
  };

  const handleEdit = (item) => { setFormData(item); setEditing(true); setShowForm(true); setSelected(null); };

  const handleAIAnalyze = async () => {
    setAiLoading(true); setAiResult('');
    try {
      const { data } = await api.post('/technicians/ai/analyze');
      setAiResult(data.analysis);
    } catch (err) { setAiResult('AI analysis failed. Please check your OpenRouter API key.'); }
    setAiLoading(false);
  };

  return (
    <>
      <div className="page-header">
        <div><h2>Technician Management</h2><div className="subtitle">Manage your team and optimize assignments</div></div>
        <div className="btn-group">
          <button className="btn btn-ai" onClick={handleAIAnalyze}>⚙️ AI Analyze Workload</button>
          <button className="btn btn-primary" onClick={() => { setFormData(emptyItem); setEditing(false); setShowForm(true); }}>+ New Technician</button>
        </div>
      </div>
      <div className="page-body">
        {aiResult && <div style={{ marginBottom: 24 }}><AIOutput content={aiResult} loading={aiLoading} title="AI Workload Analysis" /></div>}
        {aiLoading && !aiResult && <div style={{ marginBottom: 24 }}><AIOutput loading={true} /></div>}

        {selected ? (
          <>
            <div className="back-link" onClick={() => setSelected(null)}>← Back to list</div>
            <div className="detail-view">
              <div className="detail-header">
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700 }}>{selected.name}</h3>
                  <span className={`badge badge-${selected.status}`}>{selected.status}</span>
                  {' '}<span className="badge">{selected.specialty}</span>
                </div>
                <div className="btn-group">
                  <button className="btn btn-secondary" onClick={() => handleEdit(selected)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(selected.id)}>Delete</button>
                </div>
              </div>
              <div className="detail-body">
                <div className="detail-grid">
                  <div className="detail-field"><div className="label">Email</div><div className="value">{selected.email || '-'}</div></div>
                  <div className="detail-field"><div className="label">Phone</div><div className="value">{selected.phone || '-'}</div></div>
                  <div className="detail-field"><div className="label">Specialty</div><div className="value">{selected.specialty}</div></div>
                  <div className="detail-field"><div className="label">Hourly Rate</div><div className="value" style={{ fontSize: 16, fontWeight: 700 }}>${selected.hourlyRate}/hr</div></div>
                  <div className="detail-field"><div className="label">Rating</div><div className="value">{selected.rating} / 5</div></div>
                  <div className="detail-field"><div className="label">Jobs Completed</div><div className="value">{selected.jobsCompleted}</div></div>
                  <div className="detail-field"><div className="label">Hire Date</div><div className="value">{selected.hireDate || '-'}</div></div>
                  <div className="detail-field"><div className="label">Address</div><div className="value">{selected.address || '-'}</div></div>
                  <div className="detail-field"><div className="label">Certifications</div><div className="value">{selected.certifications || '-'}</div></div>
                  <div className="detail-field"><div className="label">Emergency Contact</div><div className="value">{selected.emergencyContact || '-'}</div></div>
                </div>
                {selected.notes && <div className="detail-field" style={{ marginTop: 16 }}><div className="label">Notes</div><div className="value" style={{ background: '#fffbeb', padding: 12, borderRadius: 8, border: '1px solid #fde68a' }}>{selected.notes}</div></div>}
              </div>
            </div>
          </>
        ) : (
          <div className="data-table-container">
            <div className="table-header"><h3>All Technicians ({items.length})</h3></div>
            <table className="data-table">
              <thead><tr><th>Name</th><th>Specialty</th><th>Hourly Rate</th><th>Status</th><th>Rating</th><th>Jobs Completed</th></tr></thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} onClick={() => setSelected(item)}>
                    <td className="title-cell">{item.name}</td>
                    <td>{item.specialty}</td>
                    <td style={{ fontWeight: 600 }}>${item.hourlyRate}/hr</td>
                    <td><span className={`badge badge-${item.status}`}>{item.status}</span></td>
                    <td>{item.rating}</td>
                    <td>{item.jobsCompleted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditing(false); }} title={editing ? 'Edit Technician' : 'New Technician'}
          footer={<><button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>{editing ? 'Update' : 'Create'}</button></>}>
          <div className="form-row">
            <div className="form-group"><label>Name *</label><input className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
            <div className="form-group"><label>Specialty</label><select className="form-control" value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})}><option>Plumbing</option><option>Electrical</option><option>HVAC</option></select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Email</label><input className="form-control" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
            <div className="form-group"><label>Phone</label><input className="form-control" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Hourly Rate ($)</label><input className="form-control" type="number" value={formData.hourlyRate} onChange={e => setFormData({...formData, hourlyRate: e.target.value})} /></div>
            <div className="form-group"><label>Status</label><select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}><option value="active">Active</option><option value="inactive">Inactive</option><option value="on_leave">On Leave</option></select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Hire Date</label><input className="form-control" type="date" value={formData.hireDate} onChange={e => setFormData({...formData, hireDate: e.target.value})} /></div>
            <div className="form-group"><label>Rating</label><input className="form-control" type="number" min="1" max="5" value={formData.rating} onChange={e => setFormData({...formData, rating: e.target.value})} /></div>
          </div>
          <div className="form-group"><label>Address</label><input className="form-control" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
          <div className="form-group"><label>Certifications</label><input className="form-control" value={formData.certifications} onChange={e => setFormData({...formData, certifications: e.target.value})} /></div>
          <div className="form-group"><label>Emergency Contact</label><input className="form-control" value={formData.emergencyContact} onChange={e => setFormData({...formData, emergencyContact: e.target.value})} /></div>
          <div className="form-group"><label>Notes</label><textarea className="form-control" rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
        </Modal>
      </div>
    </>
  );
}

export default Technicians;
