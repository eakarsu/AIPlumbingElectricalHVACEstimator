import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import AIOutput from '../components/AIOutput';
import { ToastContext } from '../App';

const emptyItem = {
  permitNumber: '', title: '', permitType: 'Plumbing', projectAddress: '', applicantName: '',
  issuingAuthority: '', applicationDate: '', issueDate: '', expirationDate: '', fee: '',
  status: 'pending', inspectionDate: '', inspectionResult: '', notes: ''
};

const statusColors = { pending: 'yellow', approved: 'blue', issued: 'green', expired: 'red', denied: 'red' };

function Permits() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyItem);
  const [editing, setEditing] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const addToast = useContext(ToastContext);

  const fetchItems = async () => {
    try { const { data } = await api.get('/permits'); setItems(data); } catch (err) { console.error(err); }
  };
  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    try {
      if (editing) { await api.put(`/permits/${formData.id}`, formData); addToast('Permit updated'); }
      else { await api.post('/permits', formData); addToast('Permit created'); }
      setShowForm(false); setFormData(emptyItem); setEditing(false); fetchItems();
    } catch (err) { addToast(err.response?.data?.error || 'Failed to save', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this permit?')) return;
    try { await api.delete(`/permits/${id}`); addToast('Permit deleted'); setSelected(null); fetchItems(); }
    catch (err) { addToast('Failed to delete', 'error'); }
  };

  const handleEdit = (item) => { setFormData(item); setEditing(true); setShowForm(true); setSelected(null); };

  const handleAIAnalyze = async () => {
    if (!selected) return;
    setAiLoading(true); setAiResult('');
    try {
      const { data } = await api.post('/permits/ai/analyze', selected);
      setAiResult(data.analysis);
    } catch (err) { setAiResult('AI analysis failed. Please check your OpenRouter API key.'); }
    setAiLoading(false);
  };

  return (
    <>
      <div className="page-header">
        <div><h2>Permits & Inspections</h2><div className="subtitle">Track building permits and inspection results</div></div>
        <button className="btn btn-primary" onClick={() => { setFormData(emptyItem); setEditing(false); setShowForm(true); }}>+ New Permit</button>
      </div>
      <div className="page-body">
        {selected ? (
          <>
            <div className="back-link" onClick={() => { setSelected(null); setAiResult(''); }}>← Back to list</div>
            <div className="detail-view">
              <div className="detail-header">
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700 }}>{selected.title}</h3>
                  <span className={`badge badge-${statusColors[selected.status] || 'yellow'}`}>{selected.status}</span>
                  {' '}
                  <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>{selected.permitNumber}</span>
                </div>
                <div className="btn-group">
                  <button className="btn btn-ai" onClick={handleAIAnalyze} disabled={aiLoading}>AI Analyze</button>
                  <button className="btn btn-secondary" onClick={() => handleEdit(selected)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(selected.id)}>Delete</button>
                </div>
              </div>
              <div className="detail-body">
                <div className="detail-grid">
                  <div className="detail-field"><div className="label">Permit #</div><div className="value">{selected.permitNumber || '-'}</div></div>
                  <div className="detail-field"><div className="label">Type</div><div className="value">{selected.permitType}</div></div>
                  <div className="detail-field"><div className="label">Address</div><div className="value">{selected.projectAddress || '-'}</div></div>
                  <div className="detail-field"><div className="label">Applicant</div><div className="value">{selected.applicantName || '-'}</div></div>
                  <div className="detail-field"><div className="label">Issuing Authority</div><div className="value">{selected.issuingAuthority || '-'}</div></div>
                  <div className="detail-field"><div className="label">Fee</div><div className="value">{selected.fee ? `$${selected.fee}` : '-'}</div></div>
                  <div className="detail-field"><div className="label">Application Date</div><div className="value">{selected.applicationDate || '-'}</div></div>
                  <div className="detail-field"><div className="label">Issue Date</div><div className="value">{selected.issueDate || '-'}</div></div>
                  <div className="detail-field"><div className="label">Expiration Date</div><div className="value">{selected.expirationDate || '-'}</div></div>
                  <div className="detail-field"><div className="label">Status</div><div className="value"><span className={`badge badge-${statusColors[selected.status] || 'yellow'}`}>{selected.status}</span></div></div>
                </div>
                {/* Inspection Info - Prominent Section */}
                <div style={{ marginTop: 24, padding: 16, background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
                  <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#0369a1' }}>Inspection Information</h4>
                  <div className="detail-grid">
                    <div className="detail-field"><div className="label">Inspection Date</div><div className="value">{selected.inspectionDate || '-'}</div></div>
                    <div className="detail-field"><div className="label">Inspection Result</div><div className="value" style={{ fontWeight: 600, color: selected.inspectionResult === 'pass' ? '#16a34a' : selected.inspectionResult === 'fail' ? '#dc2626' : '#6b7280' }}>{selected.inspectionResult || '-'}</div></div>
                  </div>
                </div>
                {selected.notes && <div className="detail-field" style={{ marginTop: 16 }}><div className="label">Notes</div><div className="value">{selected.notes}</div></div>}
              </div>
              <AIOutput content={aiResult} loading={aiLoading} title="AI Permit Analysis" />
            </div>
          </>
        ) : (
          <div className="data-table-container">
            <div className="table-header"><h3>All Permits ({items.length})</h3></div>
            <table className="data-table">
              <thead><tr><th>Permit #</th><th>Title</th><th>Type</th><th>Address</th><th>Fee ($)</th><th>Status</th></tr></thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} onClick={() => setSelected(item)}>
                    <td><code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{item.permitNumber}</code></td>
                    <td className="title-cell">{item.title}</td>
                    <td>{item.permitType}</td>
                    <td>{item.projectAddress}</td>
                    <td>{item.fee ? `$${item.fee}` : '-'}</td>
                    <td><span className={`badge badge-${statusColors[item.status] || 'yellow'}`}>{item.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditing(false); }} title={editing ? 'Edit Permit' : 'New Permit'}
          footer={<><button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>{editing ? 'Update' : 'Create'}</button></>}>
          <div className="form-row">
            <div className="form-group"><label>Permit Number</label><input className="form-control" value={formData.permitNumber} onChange={e => setFormData({...formData, permitNumber: e.target.value})} placeholder="e.g., PL-2026-001" /></div>
            <div className="form-group"><label>Title *</label><input className="form-control" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Permit Type *</label>
              <select className="form-control" value={formData.permitType} onChange={e => setFormData({...formData, permitType: e.target.value})}>
                <option>Plumbing</option><option>Electrical</option><option>Mechanical</option><option>Building</option><option>Fire</option>
              </select>
            </div>
            <div className="form-group"><label>Status</label>
              <select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="pending">Pending</option><option value="approved">Approved</option><option value="issued">Issued</option><option value="expired">Expired</option><option value="denied">Denied</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Project Address</label><input className="form-control" value={formData.projectAddress} onChange={e => setFormData({...formData, projectAddress: e.target.value})} /></div>
            <div className="form-group"><label>Applicant Name</label><input className="form-control" value={formData.applicantName} onChange={e => setFormData({...formData, applicantName: e.target.value})} /></div>
          </div>
          <div className="form-group"><label>Issuing Authority</label><input className="form-control" value={formData.issuingAuthority} onChange={e => setFormData({...formData, issuingAuthority: e.target.value})} /></div>
          <div className="form-row">
            <div className="form-group"><label>Application Date</label><input className="form-control" type="date" value={formData.applicationDate} onChange={e => setFormData({...formData, applicationDate: e.target.value})} /></div>
            <div className="form-group"><label>Issue Date</label><input className="form-control" type="date" value={formData.issueDate} onChange={e => setFormData({...formData, issueDate: e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Expiration Date</label><input className="form-control" type="date" value={formData.expirationDate} onChange={e => setFormData({...formData, expirationDate: e.target.value})} /></div>
            <div className="form-group"><label>Fee ($)</label><input className="form-control" type="number" value={formData.fee} onChange={e => setFormData({...formData, fee: e.target.value})} placeholder="0.00" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Inspection Date</label><input className="form-control" type="date" value={formData.inspectionDate} onChange={e => setFormData({...formData, inspectionDate: e.target.value})} /></div>
            <div className="form-group"><label>Inspection Result</label><input className="form-control" value={formData.inspectionResult} onChange={e => setFormData({...formData, inspectionResult: e.target.value})} placeholder="e.g., pass, fail, pending" /></div>
          </div>
          <div className="form-group"><label>Notes</label><textarea className="form-control" rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
        </Modal>
      </div>
    </>
  );
}

export default Permits;
