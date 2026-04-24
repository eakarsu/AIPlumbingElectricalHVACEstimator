import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import AIOutput from '../components/AIOutput';
import { ToastContext } from '../App';

const emptyItem = {
  title: '', codeReference: '', category: 'Plumbing', description: '', jurisdiction: '',
  requirements: '', status: 'active', effectiveDate: '', penalties: '', inspectionRequired: false, notes: ''
};

function CodeCompliance() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyItem);
  const [editing, setEditing] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDesc, setAiDesc] = useState('');
  const [aiJurisdiction, setAiJurisdiction] = useState('');
  const [aiCategory, setAiCategory] = useState('Plumbing');
  const addToast = useContext(ToastContext);

  const fetchItems = async () => {
    try { const { data } = await api.get('/code-compliance'); setItems(data); } catch (err) { console.error(err); }
  };
  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    try {
      if (editing) { await api.put(`/code-compliance/${formData.id}`, formData); addToast('Record updated'); }
      else { await api.post('/code-compliance', formData); addToast('Record created'); }
      setShowForm(false); setFormData(emptyItem); setEditing(false); fetchItems();
    } catch (err) { addToast(err.response?.data?.error || 'Failed to save', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try { await api.delete(`/code-compliance/${id}`); addToast('Record deleted'); setSelected(null); fetchItems(); }
    catch (err) { addToast('Failed to delete', 'error'); }
  };

  const handleEdit = (item) => { setFormData(item); setEditing(true); setShowForm(true); setSelected(null); };

  const handleAICheck = async () => {
    if (!aiDesc) return;
    setAiLoading(true); setAiResult('');
    try {
      const { data } = await api.post('/code-compliance/ai/check', { description: aiDesc, jurisdiction: aiJurisdiction, category: aiCategory });
      setAiResult(data.compliance);
    } catch (err) { setAiResult('AI check failed. Please check your OpenRouter API key.'); }
    setAiLoading(false);
  };

  return (
    <>
      <div className="page-header">
        <div><h2>Building Code Compliance</h2><div className="subtitle">Track codes and get AI compliance guidance</div></div>
        <button className="btn btn-primary" onClick={() => { setFormData(emptyItem); setEditing(false); setShowForm(true); }}>+ New Record</button>
      </div>
      <div className="page-body">
        {/* AI Compliance Checker */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>✅ AI Compliance Checker</h3>
          <div className="form-row">
            <div className="form-group"><label>Project Description</label><textarea className="form-control" rows={3} value={aiDesc} onChange={e => setAiDesc(e.target.value)} placeholder="Describe the project to check compliance..." /></div>
            <div>
              <div className="form-group"><label>Jurisdiction</label><input className="form-control" value={aiJurisdiction} onChange={e => setAiJurisdiction(e.target.value)} placeholder="e.g., Illinois, California" /></div>
              <div className="form-group"><label>Category</label>
                <select className="form-control" value={aiCategory} onChange={e => setAiCategory(e.target.value)}>
                  <option>Plumbing</option><option>Electrical</option><option>HVAC</option>
                </select>
              </div>
              <button className="btn btn-ai" style={{ width: '100%' }} onClick={handleAICheck} disabled={!aiDesc || aiLoading}>✅ Check Compliance</button>
            </div>
          </div>
          <AIOutput content={aiResult} loading={aiLoading} title="AI Compliance Analysis" />
        </div>

        {selected ? (
          <>
            <div className="back-link" onClick={() => setSelected(null)}>← Back to list</div>
            <div className="detail-view">
              <div className="detail-header">
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700 }}>{selected.title}</h3>
                  <span className={`badge badge-${selected.status}`}>{selected.status}</span>
                  {' '}
                  <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>{selected.codeReference}</span>
                </div>
                <div className="btn-group">
                  <button className="btn btn-secondary" onClick={() => handleEdit(selected)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(selected.id)}>Delete</button>
                </div>
              </div>
              <div className="detail-body">
                <div className="detail-grid">
                  <div className="detail-field"><div className="label">Code Reference</div><div className="value">{selected.codeReference}</div></div>
                  <div className="detail-field"><div className="label">Category</div><div className="value">{selected.category}</div></div>
                  <div className="detail-field"><div className="label">Jurisdiction</div><div className="value">{selected.jurisdiction || '-'}</div></div>
                  <div className="detail-field"><div className="label">Effective Date</div><div className="value">{selected.effectiveDate || '-'}</div></div>
                  <div className="detail-field"><div className="label">Inspection Required</div><div className="value">{selected.inspectionRequired ? 'Yes' : 'No'}</div></div>
                  <div className="detail-field"><div className="label">Status</div><div className="value"><span className={`badge badge-${selected.status}`}>{selected.status}</span></div></div>
                </div>
                <div className="detail-field" style={{ marginTop: 16 }}><div className="label">Description</div><div className="value">{selected.description}</div></div>
                <div className="detail-field" style={{ marginTop: 16 }}><div className="label">Requirements</div><div className="value" style={{ lineHeight: 1.8 }}>{selected.requirements}</div></div>
                {selected.penalties && <div className="detail-field" style={{ marginTop: 16 }}><div className="label">Penalties</div><div className="value" style={{ color: '#dc2626' }}>{selected.penalties}</div></div>}
                {selected.notes && <div className="detail-field" style={{ marginTop: 16 }}><div className="label">Notes</div><div className="value">{selected.notes}</div></div>}
              </div>
            </div>
          </>
        ) : (
          <div className="data-table-container">
            <div className="table-header"><h3>All Compliance Records ({items.length})</h3></div>
            <table className="data-table">
              <thead><tr><th>Title</th><th>Code Ref</th><th>Category</th><th>Jurisdiction</th><th>Inspection</th><th>Status</th></tr></thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} onClick={() => setSelected(item)}>
                    <td className="title-cell">{item.title}</td>
                    <td><code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{item.codeReference}</code></td>
                    <td>{item.category}</td>
                    <td>{item.jurisdiction}</td>
                    <td>{item.inspectionRequired ? '✓ Yes' : 'No'}</td>
                    <td><span className={`badge badge-${item.status}`}>{item.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditing(false); }} title={editing ? 'Edit Record' : 'New Compliance Record'}
          footer={<><button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>{editing ? 'Update' : 'Create'}</button></>}>
          <div className="form-row">
            <div className="form-group"><label>Title *</label><input className="form-control" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
            <div className="form-group"><label>Code Reference *</label><input className="form-control" value={formData.codeReference} onChange={e => setFormData({...formData, codeReference: e.target.value})} placeholder="e.g., NEC 210.8" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Category *</label><select className="form-control" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}><option>Plumbing</option><option>Electrical</option><option>HVAC</option></select></div>
            <div className="form-group"><label>Jurisdiction</label><input className="form-control" value={formData.jurisdiction} onChange={e => setFormData({...formData, jurisdiction: e.target.value})} /></div>
          </div>
          <div className="form-group"><label>Description *</label><textarea className="form-control" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
          <div className="form-group"><label>Requirements</label><textarea className="form-control" rows={3} value={formData.requirements} onChange={e => setFormData({...formData, requirements: e.target.value})} /></div>
          <div className="form-row">
            <div className="form-group"><label>Effective Date</label><input className="form-control" type="date" value={formData.effectiveDate} onChange={e => setFormData({...formData, effectiveDate: e.target.value})} /></div>
            <div className="form-group"><label>Inspection Required</label><select className="form-control" value={formData.inspectionRequired} onChange={e => setFormData({...formData, inspectionRequired: e.target.value === 'true'})}><option value="false">No</option><option value="true">Yes</option></select></div>
          </div>
          <div className="form-group"><label>Penalties</label><input className="form-control" value={formData.penalties} onChange={e => setFormData({...formData, penalties: e.target.value})} /></div>
          <div className="form-group"><label>Notes</label><textarea className="form-control" rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
        </Modal>
      </div>
    </>
  );
}

export default CodeCompliance;
