import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import AIOutput from '../components/AIOutput';
import { ToastContext } from '../App';

const emptyItem = {
  name: '', description: '', customerName: '', customerPhone: '', address: '',
  projectType: 'Plumbing', status: 'planning', startDate: '', endDate: '',
  budget: '', actualCost: '', completionPercent: 0, priority: 'medium',
  assignedTechnician: '', notes: ''
};

function Projects() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyItem);
  const [editing, setEditing] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const addToast = useContext(ToastContext);

  const fetchItems = async (p = 1) => {
    try {
      const { data } = await api.get(`/projects?page=${p}&limit=20`);
      // Handle both paginated and legacy array responses
      if (data && data.data) {
        setItems(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || data.data.length);
      } else if (Array.isArray(data)) {
        setItems(data);
        setTotal(data.length);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchItems(page); }, [page]);

  const handleSave = async () => {
    try {
      if (editing) {
        await api.put(`/projects/${formData.id}`, formData);
        addToast('Project updated successfully');
      } else {
        await api.post('/projects', formData);
        addToast('Project created successfully');
      }
      setShowForm(false);
      setFormData(emptyItem);
      setEditing(false);
      fetchItems(page);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to save', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await api.delete(`/projects/${id}`);
      addToast('Project deleted');
      setSelected(null);
      fetchItems(page);
    } catch (err) {
      addToast('Failed to delete', 'error');
    }
  };

  const handleEdit = (item) => {
    setFormData(item);
    setEditing(true);
    setShowForm(true);
    setSelected(null);
  };

  const handleAIAnalyze = async (description, projectType) => {
    setAiLoading(true);
    setAiResult('');
    try {
      const { data } = await api.post('/projects/ai/analyze', { description, projectType });
      setAiResult(data.analysis);
    } catch (err) {
      setAiResult('AI analysis failed. Please check your OpenRouter API key in .env file.');
    }
    setAiLoading(false);
  };

  const handleAnalyzeExisting = async (id) => {
    setAiLoading(true);
    setAiResult('');
    try {
      const { data } = await api.post(`/projects/${id}/analyze`);
      setAiResult(data.analysis);
      fetchItems();
    } catch (err) {
      setAiResult('AI analysis failed. Please check your OpenRouter API key.');
    }
    setAiLoading(false);
  };

  const budgetNum = parseFloat(selected?.budget || 0);
  const actualNum = parseFloat(selected?.actualCost || 0);
  const budgetDiff = budgetNum - actualNum;

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Project Tracking</h2>
          <div className="subtitle">Track project progress and budgets</div>
        </div>
        <div className="btn-group">
          <button className="btn btn-ai" onClick={() => handleAIAnalyze('General project portfolio analysis', 'All')}>
            🤖 AI Analyze Projects
          </button>
          <button className="btn btn-primary" onClick={() => { setFormData(emptyItem); setEditing(false); setShowForm(true); }}>
            + New Project
          </button>
        </div>
      </div>
      <div className="page-body">
        {selected ? (
          <>
            <div className="back-link" onClick={() => { setSelected(null); setAiResult(''); }}>
              ← Back to list
            </div>
            <div className="detail-view">
              <div className="detail-header">
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700 }}>{selected.name}</h3>
                  <span className={`badge badge-${selected.status}`}>{selected.status}</span>
                  {' '}
                  <span className={`badge badge-${selected.priority}`}>{selected.priority} priority</span>
                </div>
                <div className="btn-group">
                  <button className="btn btn-ai" onClick={() => handleAnalyzeExisting(selected.id)}>
                    🤖 AI Analyze
                  </button>
                  <button className="btn btn-secondary" onClick={() => handleEdit(selected)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(selected.id)}>Delete</button>
                </div>
              </div>
              <div className="detail-body">
                <div className="detail-grid">
                  <div className="detail-field">
                    <div className="label">Project Type</div>
                    <div className="value">{selected.projectType}</div>
                  </div>
                  <div className="detail-field">
                    <div className="label">Customer</div>
                    <div className="value">{selected.customerName || '-'}</div>
                  </div>
                  <div className="detail-field">
                    <div className="label">Phone</div>
                    <div className="value">{selected.customerPhone || '-'}</div>
                  </div>
                  <div className="detail-field">
                    <div className="label">Address</div>
                    <div className="value">{selected.address || '-'}</div>
                  </div>
                  <div className="detail-field">
                    <div className="label">Assigned Technician</div>
                    <div className="value">{selected.assignedTechnician || '-'}</div>
                  </div>
                  <div className="detail-field">
                    <div className="label">Start Date</div>
                    <div className="value">{selected.startDate || '-'}</div>
                  </div>
                  <div className="detail-field">
                    <div className="label">End Date</div>
                    <div className="value">{selected.endDate || '-'}</div>
                  </div>
                </div>

                <div className="detail-field" style={{ marginTop: 16 }}>
                  <div className="label">Completion ({selected.completionPercent || 0}%)</div>
                  <div style={{ background: '#e5e7eb', borderRadius: 8, height: 24, marginTop: 4, overflow: 'hidden' }}>
                    <div style={{
                      background: (selected.completionPercent || 0) === 100 ? '#059669' : '#3b82f6',
                      width: `${selected.completionPercent || 0}%`,
                      height: '100%',
                      borderRadius: 8,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                <div className="detail-grid" style={{ marginTop: 16 }}>
                  <div className="detail-field">
                    <div className="label">Budget</div>
                    <div className="value" style={{ fontSize: 20, fontWeight: 700, color: '#059669' }}>
                      ${budgetNum.toLocaleString()}
                    </div>
                  </div>
                  <div className="detail-field">
                    <div className="label">Actual Cost</div>
                    <div className="value" style={{ fontSize: 20, fontWeight: 700, color: actualNum > budgetNum && budgetNum > 0 ? '#dc2626' : '#059669' }}>
                      ${actualNum.toLocaleString()}
                    </div>
                  </div>
                  <div className="detail-field">
                    <div className="label">{budgetDiff >= 0 ? 'Under Budget' : 'Over Budget'}</div>
                    <div className="value" style={{ fontSize: 20, fontWeight: 700, color: budgetDiff >= 0 ? '#059669' : '#dc2626' }}>
                      ${Math.abs(budgetDiff).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="detail-field" style={{ marginTop: 16 }}>
                  <div className="label">Description</div>
                  <div className="value" style={{ lineHeight: 1.6 }}>{selected.description || '-'}</div>
                </div>
                <div className="detail-field" style={{ marginTop: 16 }}>
                  <div className="label">Notes</div>
                  <div className="value" style={{ lineHeight: 1.6 }}>{selected.notes || '-'}</div>
                </div>
                {selected.aiAnalysis && !aiResult && (
                  <AIOutput content={selected.aiAnalysis} title="Previous AI Analysis" />
                )}
                <AIOutput content={aiResult} loading={aiLoading} title="AI Project Analysis" />
              </div>
            </div>
          </>
        ) : (
          <div className="data-table-container">
            <div className="table-header">
              <h3>All Projects ({total})</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Budget</th>
                  <th>Completion</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} onClick={() => setSelected(item)}>
                    <td className="title-cell">{item.name}</td>
                    <td>{item.customerName}</td>
                    <td>{item.projectType}</td>
                    <td><span className={`badge badge-${item.status}`}>{item.status}</span></td>
                    <td style={{ fontWeight: 600 }}>${parseFloat(item.budget || 0).toLocaleString()}</td>
                    <td>{item.completionPercent || 0}%</td>
                    <td><span className={`badge badge-${item.priority}`}>{item.priority}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: '16px 0' }}>
                <button className="btn btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
                <span style={{ fontSize: 14, color: '#6b7280' }}>Page {page} of {totalPages}</span>
                <button className="btn btn-secondary" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
              </div>
            )}
          </div>
        )}

        <Modal
          isOpen={showForm}
          onClose={() => { setShowForm(false); setEditing(false); setAiResult(''); }}
          title={editing ? 'Edit Project' : 'New Project'}
          footer={
            <>
              <button className="btn btn-ai" onClick={() => handleAIAnalyze(formData.description, formData.projectType)} disabled={!formData.description}>
                🤖 AI Analyze
              </button>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>
                {editing ? 'Update' : 'Create'} Project
              </button>
            </>
          }
        >
          <div className="form-row">
            <div className="form-group">
              <label>Project Name *</label>
              <input className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g., Office HVAC Overhaul" required />
            </div>
            <div className="form-group">
              <label>Project Type *</label>
              <select className="form-control" value={formData.projectType} onChange={e => setFormData({...formData, projectType: e.target.value})}>
                <option>Plumbing</option>
                <option>Electrical</option>
                <option>HVAC</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Description *</label>
            <textarea className="form-control" rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe the project in detail..." />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Customer Name *</label>
              <input className="form-control" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Customer Phone</label>
              <input className="form-control" value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Address</label>
              <input className="form-control" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Assigned Technician</label>
              <input className="form-control" value={formData.assignedTechnician} onChange={e => setFormData({...formData, assignedTechnician: e.target.value})} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input className="form-control" type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input className="form-control" type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Budget ($)</label>
              <input className="form-control" type="number" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Actual Cost ($)</label>
              <input className="form-control" type="number" value={formData.actualCost} onChange={e => setFormData({...formData, actualCost: e.target.value})} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Completion Percent</label>
              <input className="form-control" type="number" min="0" max="100" value={formData.completionPercent} onChange={e => setFormData({...formData, completionPercent: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="planning">Planning</option>
                <option value="in_progress">In Progress</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Priority</label>
              <select className="form-control" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea className="form-control" rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Additional notes..." />
          </div>
          <AIOutput content={aiResult} loading={aiLoading} title="AI Project Analysis" />
        </Modal>
      </div>
    </>
  );
}

export default Projects;
