import React, { useState, useEffect, useContext, useMemo } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import AIOutput from '../components/AIOutput';
import SearchFilter from '../components/SearchFilter';
import { ToastContext } from '../App';

const emptyQuote = {
  title: '', description: '', jobType: 'Plumbing', customerName: '', customerPhone: '',
  customerEmail: '', address: '', estimatedCost: '', laborHours: '', status: 'pending', priority: 'medium'
};

function JobQuotes() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyQuote);
  const [editing, setEditing] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const addToast = useContext(ToastContext);

  const filteredItems = useMemo(() => {
    let result = items.filter(item => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = !search ||
        item.title?.toLowerCase().includes(search) ||
        item.customerName?.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search) ||
        item.address?.toLowerCase().includes(search);
      const matchesType = !filterType || item.jobType === filterType;
      const matchesStatus = !filterStatus || item.status === filterStatus;
      const matchesPriority = !filterPriority || item.priority === filterPriority;
      return matchesSearch && matchesType && matchesStatus && matchesPriority;
    });
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest': return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'oldest': return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case 'cost-high': return parseFloat(b.estimatedCost || 0) - parseFloat(a.estimatedCost || 0);
        case 'cost-low': return parseFloat(a.estimatedCost || 0) - parseFloat(b.estimatedCost || 0);
        case 'title': return (a.title || '').localeCompare(b.title || '');
        default: return 0;
      }
    });
    return result;
  }, [items, searchTerm, filterType, filterStatus, filterPriority, sortBy]);

  const fetchItems = async () => {
    try {
      const { data } = await api.get('/job-quotes');
      setItems(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    try {
      if (editing) {
        await api.put(`/job-quotes/${formData.id}`, formData);
        addToast('Quote updated successfully');
      } else {
        await api.post('/job-quotes', formData);
        addToast('Quote created successfully');
      }
      setShowForm(false);
      setFormData(emptyQuote);
      setEditing(false);
      fetchItems();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to save', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this quote?')) return;
    try {
      await api.delete(`/job-quotes/${id}`);
      addToast('Quote deleted');
      setSelected(null);
      fetchItems();
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

  const handleAIAnalyze = async (description, jobType) => {
    setAiLoading(true);
    setAiResult('');
    try {
      const { data } = await api.post('/job-quotes/ai/analyze', { description, jobType });
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
      const { data } = await api.post(`/job-quotes/${id}/analyze`);
      setAiResult(data.analysis);
      fetchItems();
    } catch (err) {
      setAiResult('AI analysis failed. Please check your OpenRouter API key.');
    }
    setAiLoading(false);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Job Quotes</h2>
          <div className="subtitle">Manage and estimate job quotes with AI assistance</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setFormData(emptyQuote); setEditing(false); setShowForm(true); }}>
          + New Quote
        </button>
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
                  <h3 style={{ fontSize: 20, fontWeight: 700 }}>{selected.title}</h3>
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
                    <div className="label">Job Type</div>
                    <div className="value">{selected.jobType}</div>
                  </div>
                  <div className="detail-field">
                    <div className="label">Customer</div>
                    <div className="value">{selected.customerName}</div>
                  </div>
                  <div className="detail-field">
                    <div className="label">Phone</div>
                    <div className="value">{selected.customerPhone || '-'}</div>
                  </div>
                  <div className="detail-field">
                    <div className="label">Email</div>
                    <div className="value">{selected.customerEmail || '-'}</div>
                  </div>
                  <div className="detail-field">
                    <div className="label">Address</div>
                    <div className="value">{selected.address || '-'}</div>
                  </div>
                  <div className="detail-field">
                    <div className="label">Estimated Cost</div>
                    <div className="value" style={{ fontSize: 20, fontWeight: 700, color: '#059669' }}>
                      ${parseFloat(selected.estimatedCost || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="detail-field">
                    <div className="label">Labor Hours</div>
                    <div className="value">{selected.laborHours || '-'} hrs</div>
                  </div>
                </div>
                <div className="detail-field" style={{ marginTop: 16 }}>
                  <div className="label">Description</div>
                  <div className="value" style={{ lineHeight: 1.6 }}>{selected.description}</div>
                </div>
                {selected.aiAnalysis && !aiResult && (
                  <AIOutput content={selected.aiAnalysis} title="Previous AI Analysis" />
                )}
                <AIOutput content={aiResult} loading={aiLoading} title="AI Job Analysis" />
              </div>
            </div>
          </>
        ) : (
          <div className="data-table-container">
            <SearchFilter
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filters={[
                { label: 'All Types', value: filterType, onChange: setFilterType, options: ['Plumbing', 'Electrical', 'HVAC'] },
                { label: 'All Statuses', value: filterStatus, onChange: setFilterStatus, options: [
                  { value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' },
                  { value: 'in_progress', label: 'In Progress' }, { value: 'completed', label: 'Completed' }
                ]},
                { label: 'All Priorities', value: filterPriority, onChange: setFilterPriority, options: ['low', 'medium', 'high'] }
              ]}
              sortOptions={[
                { value: 'newest', label: 'Newest First' }, { value: 'oldest', label: 'Oldest First' },
                { value: 'cost-high', label: 'Cost: High to Low' }, { value: 'cost-low', label: 'Cost: Low to High' },
                { value: 'title', label: 'Title A-Z' }
              ]}
              sortValue={sortBy}
              onSortChange={setSortBy}
              resultCount={filteredItems.length}
              totalCount={items.length}
            />
            <div className="table-header">
              <h3>Quotes ({filteredItems.length})</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Customer</th>
                  <th>Estimated Cost</th>
                  <th>Status</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>No quotes match your search</td></tr>
                ) : filteredItems.map(item => (
                  <tr key={item.id} onClick={() => setSelected(item)}>
                    <td className="title-cell">{item.title}</td>
                    <td>{item.jobType}</td>
                    <td>{item.customerName}</td>
                    <td style={{ fontWeight: 600 }}>${parseFloat(item.estimatedCost || 0).toLocaleString()}</td>
                    <td><span className={`badge badge-${item.status}`}>{item.status}</span></td>
                    <td><span className={`badge badge-${item.priority}`}>{item.priority}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal
          isOpen={showForm}
          onClose={() => { setShowForm(false); setEditing(false); setAiResult(''); }}
          title={editing ? 'Edit Quote' : 'New Job Quote'}
          footer={
            <>
              <button className="btn btn-ai" onClick={() => handleAIAnalyze(formData.description, formData.jobType)} disabled={!formData.description}>
                🤖 AI Estimate
              </button>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>
                {editing ? 'Update' : 'Create'} Quote
              </button>
            </>
          }
        >
          <div className="form-row">
            <div className="form-group">
              <label>Title *</label>
              <input className="form-control" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g., Water Heater Replacement" required />
            </div>
            <div className="form-group">
              <label>Job Type *</label>
              <select className="form-control" value={formData.jobType} onChange={e => setFormData({...formData, jobType: e.target.value})}>
                <option>Plumbing</option>
                <option>Electrical</option>
                <option>HVAC</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Description *</label>
            <textarea className="form-control" rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe the job in detail..." />
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
              <label>Customer Email</label>
              <input className="form-control" type="email" value={formData.customerEmail} onChange={e => setFormData({...formData, customerEmail: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input className="form-control" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Estimated Cost ($)</label>
              <input className="form-control" type="number" value={formData.estimatedCost} onChange={e => setFormData({...formData, estimatedCost: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Labor Hours</label>
              <input className="form-control" type="number" value={formData.laborHours} onChange={e => setFormData({...formData, laborHours: e.target.value})} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select className="form-control" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <AIOutput content={aiResult} loading={aiLoading} title="AI Job Estimate" />
        </Modal>
      </div>
    </>
  );
}

export default JobQuotes;
