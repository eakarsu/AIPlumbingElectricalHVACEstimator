import React, { useState, useEffect, useContext, useMemo } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import AIOutput from '../components/AIOutput';
import SearchFilter from '../components/SearchFilter';
import { ToastContext } from '../App';

const emptyItem = {
  title: '', description: '', jobType: 'Plumbing', customerName: '', customerPhone: '',
  address: '', technicianName: '', scheduledDate: '', startTime: '08:00', endTime: '',
  status: 'scheduled', priority: 'medium', estimatedDuration: 1, notes: ''
};

function Schedules() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyItem);
  const [editing, setEditing] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('date-asc');
  const addToast = useContext(ToastContext);

  const filteredItems = useMemo(() => {
    let result = items.filter(item => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = !search ||
        item.title?.toLowerCase().includes(search) ||
        item.customerName?.toLowerCase().includes(search) ||
        item.technicianName?.toLowerCase().includes(search) ||
        item.address?.toLowerCase().includes(search);
      const matchesType = !filterType || item.jobType === filterType;
      const matchesStatus = !filterStatus || item.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc': return new Date(a.scheduledDate || '9999') - new Date(b.scheduledDate || '9999');
        case 'date-desc': return new Date(b.scheduledDate || 0) - new Date(a.scheduledDate || 0);
        case 'title': return (a.title || '').localeCompare(b.title || '');
        case 'priority': {
          const order = { high: 0, medium: 1, low: 2 };
          return (order[a.priority] || 1) - (order[b.priority] || 1);
        }
        default: return 0;
      }
    });
    return result;
  }, [items, searchTerm, filterType, filterStatus, sortBy]);

  const fetchItems = async () => {
    try { const { data } = await api.get('/schedules'); setItems(data); } catch (err) { console.error(err); }
  };
  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    try {
      if (editing) { await api.put(`/schedules/${formData.id}`, formData); addToast('Schedule updated'); }
      else { await api.post('/schedules', formData); addToast('Schedule created'); }
      setShowForm(false); setFormData(emptyItem); setEditing(false); fetchItems();
    } catch (err) { addToast(err.response?.data?.error || 'Failed to save', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this schedule?')) return;
    try { await api.delete(`/schedules/${id}`); addToast('Schedule deleted'); setSelected(null); fetchItems(); }
    catch (err) { addToast('Failed to delete', 'error'); }
  };

  const handleEdit = (item) => { setFormData(item); setEditing(true); setShowForm(true); setSelected(null); };

  const handleAIOptimize = async () => {
    setAiLoading(true); setAiResult('');
    try {
      const { data } = await api.post('/schedules/ai/optimize');
      setAiResult(data.optimization);
    } catch (err) { setAiResult('AI optimization failed. Please check your OpenRouter API key.'); }
    setAiLoading(false);
  };

  return (
    <>
      <div className="page-header">
        <div><h2>Job Scheduling</h2><div className="subtitle">Manage technician schedules and optimize routes</div></div>
        <div className="btn-group">
          <button className="btn btn-ai" onClick={handleAIOptimize}>⚙️ AI Optimize Schedule</button>
          <button className="btn btn-primary" onClick={() => { setFormData(emptyItem); setEditing(false); setShowForm(true); }}>+ New Schedule</button>
        </div>
      </div>
      <div className="page-body">
        {aiResult && <div style={{ marginBottom: 24 }}><AIOutput content={aiResult} loading={aiLoading} title="AI Schedule Optimization" /></div>}
        {aiLoading && !aiResult && <div style={{ marginBottom: 24 }}><AIOutput loading={true} /></div>}

        {selected ? (
          <>
            <div className="back-link" onClick={() => setSelected(null)}>← Back to list</div>
            <div className="detail-view">
              <div className="detail-header">
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700 }}>{selected.title}</h3>
                  <span className={`badge badge-${selected.status}`}>{selected.status}</span>
                  {' '}<span className={`badge badge-${selected.priority}`}>{selected.priority}</span>
                </div>
                <div className="btn-group">
                  <button className="btn btn-secondary" onClick={() => handleEdit(selected)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(selected.id)}>Delete</button>
                </div>
              </div>
              <div className="detail-body">
                <div className="detail-grid">
                  <div className="detail-field"><div className="label">Job Type</div><div className="value">{selected.jobType}</div></div>
                  <div className="detail-field"><div className="label">Customer</div><div className="value">{selected.customerName}</div></div>
                  <div className="detail-field"><div className="label">Phone</div><div className="value">{selected.customerPhone || '-'}</div></div>
                  <div className="detail-field"><div className="label">Address</div><div className="value">{selected.address || '-'}</div></div>
                  <div className="detail-field"><div className="label">Technician</div><div className="value">{selected.technicianName || '-'}</div></div>
                  <div className="detail-field"><div className="label">Date</div><div className="value" style={{ fontSize: 16, fontWeight: 700 }}>{selected.scheduledDate}</div></div>
                  <div className="detail-field"><div className="label">Time</div><div className="value">{selected.startTime} - {selected.endTime || 'TBD'}</div></div>
                  <div className="detail-field"><div className="label">Duration</div><div className="value">{selected.estimatedDuration} hrs</div></div>
                </div>
                {selected.description && <div className="detail-field" style={{ marginTop: 16 }}><div className="label">Description</div><div className="value">{selected.description}</div></div>}
                {selected.notes && <div className="detail-field" style={{ marginTop: 16 }}><div className="label">Notes</div><div className="value" style={{ background: '#fffbeb', padding: 12, borderRadius: 8, border: '1px solid #fde68a' }}>{selected.notes}</div></div>}
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
                  { value: 'scheduled', label: 'Scheduled' }, { value: 'in_progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' }
                ]}
              ]}
              sortOptions={[
                { value: 'date-asc', label: 'Date: Soonest' }, { value: 'date-desc', label: 'Date: Latest' },
                { value: 'priority', label: 'Priority' }, { value: 'title', label: 'Title A-Z' }
              ]}
              sortValue={sortBy}
              onSortChange={setSortBy}
              resultCount={filteredItems.length}
              totalCount={items.length}
            />
            <div className="table-header"><h3>Schedules ({filteredItems.length})</h3></div>
            <table className="data-table">
              <thead><tr><th>Title</th><th>Date</th><th>Time</th><th>Technician</th><th>Customer</th><th>Type</th><th>Status</th></tr></thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>No schedules match your search</td></tr>
                ) : filteredItems.map(item => (
                  <tr key={item.id} onClick={() => setSelected(item)}>
                    <td className="title-cell">{item.title}</td>
                    <td style={{ fontWeight: 600 }}>{item.scheduledDate}</td>
                    <td>{item.startTime} - {item.endTime || '?'}</td>
                    <td>{item.technicianName || '-'}</td>
                    <td>{item.customerName}</td>
                    <td>{item.jobType}</td>
                    <td><span className={`badge badge-${item.status}`}>{item.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditing(false); }} title={editing ? 'Edit Schedule' : 'New Schedule'}
          footer={<><button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>{editing ? 'Update' : 'Create'}</button></>}>
          <div className="form-row">
            <div className="form-group"><label>Title *</label><input className="form-control" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
            <div className="form-group"><label>Job Type</label><select className="form-control" value={formData.jobType} onChange={e => setFormData({...formData, jobType: e.target.value})}><option>Plumbing</option><option>Electrical</option><option>HVAC</option></select></div>
          </div>
          <div className="form-group"><label>Description</label><textarea className="form-control" rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
          <div className="form-row">
            <div className="form-group"><label>Customer Name *</label><input className="form-control" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} /></div>
            <div className="form-group"><label>Customer Phone</label><input className="form-control" value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Address</label><input className="form-control" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
            <div className="form-group"><label>Technician</label><input className="form-control" value={formData.technicianName} onChange={e => setFormData({...formData, technicianName: e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Date *</label><input className="form-control" type="date" value={formData.scheduledDate} onChange={e => setFormData({...formData, scheduledDate: e.target.value})} /></div>
            <div className="form-group"><label>Estimated Duration (hrs)</label><input className="form-control" type="number" value={formData.estimatedDuration} onChange={e => setFormData({...formData, estimatedDuration: e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Start Time *</label><input className="form-control" type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} /></div>
            <div className="form-group"><label>End Time</label><input className="form-control" type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Status</label><select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}><option value="scheduled">Scheduled</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
            <div className="form-group"><label>Priority</label><select className="form-control" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
          </div>
          <div className="form-group"><label>Notes</label><textarea className="form-control" rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
        </Modal>
      </div>
    </>
  );
}

export default Schedules;
