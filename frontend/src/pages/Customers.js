import React, { useState, useEffect, useContext, useMemo } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import AIOutput from '../components/AIOutput';
import SearchFilter from '../components/SearchFilter';
import { ToastContext } from '../App';

const emptyItem = {
  name: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '',
  notes: '', propertyType: 'residential', preferredContact: 'phone', totalSpent: '', jobCount: '', rating: 5
};

function Customers() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyItem);
  const [editing, setEditing] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPropertyType, setFilterPropertyType] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const addToast = useContext(ToastContext);

  const filteredItems = useMemo(() => {
    let result = items.filter(item => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = !search ||
        item.name?.toLowerCase().includes(search) ||
        item.email?.toLowerCase().includes(search) ||
        item.phone?.toLowerCase().includes(search) ||
        item.city?.toLowerCase().includes(search) ||
        item.address?.toLowerCase().includes(search);
      const matchesType = !filterPropertyType || item.propertyType === filterPropertyType;
      return matchesSearch && matchesType;
    });
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name': return (a.name || '').localeCompare(b.name || '');
        case 'spent-high': return parseFloat(b.totalSpent || 0) - parseFloat(a.totalSpent || 0);
        case 'spent-low': return parseFloat(a.totalSpent || 0) - parseFloat(b.totalSpent || 0);
        case 'rating': return parseFloat(b.rating || 0) - parseFloat(a.rating || 0);
        case 'jobs': return parseInt(b.jobCount || 0) - parseInt(a.jobCount || 0);
        default: return 0;
      }
    });
    return result;
  }, [items, searchTerm, filterPropertyType, sortBy]);

  const fetchItems = async () => {
    try { const { data } = await api.get('/customers'); setItems(data); } catch (err) { console.error(err); }
  };
  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    try {
      if (editing) {
        await api.put(`/customers/${formData.id}`, formData);
        addToast('Customer updated');
      } else {
        await api.post('/customers', formData);
        addToast('Customer created');
      }
      setShowForm(false); setFormData(emptyItem); setEditing(false); fetchItems();
    } catch (err) { addToast(err.response?.data?.error || 'Failed to save', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    try { await api.delete(`/customers/${id}`); addToast('Customer deleted'); setSelected(null); fetchItems(); }
    catch (err) { addToast('Failed to delete', 'error'); }
  };

  const handleEdit = (item) => { setFormData(item); setEditing(true); setShowForm(true); setSelected(null); };

  const handleAIAnalyze = async () => {
    setAiLoading(true); setAiResult('');
    try {
      const { data } = await api.post('/customers/ai/analyze', { customerData: selected });
      setAiResult(data.analysis);
    } catch (err) { setAiResult('AI analysis failed. Please check your OpenRouter API key.'); }
    setAiLoading(false);
  };

  const renderStars = (rating) => {
    const count = Math.round(rating || 0);
    return '★'.repeat(count) + '☆'.repeat(5 - count);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Customer Management</h2>
          <div className="subtitle">Track customers and get AI retention insights</div>
        </div>
        <div className="btn-group">
          <button className="btn btn-primary" onClick={() => { setFormData(emptyItem); setEditing(false); setShowForm(true); }}>+ New Customer</button>
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
                  <span className="badge" style={{ background: '#e0e7ff', color: '#3730a3' }}>{selected.propertyType}</span>
                  {' '}
                  <span style={{ color: '#f59e0b', fontSize: 16 }}>{renderStars(selected.rating)}</span>
                </div>
                <div className="btn-group">
                  <button className="btn btn-ai" onClick={handleAIAnalyze} disabled={aiLoading}>🧠 AI Analyze Customer</button>
                  <button className="btn btn-secondary" onClick={() => handleEdit(selected)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(selected.id)}>Delete</button>
                </div>
              </div>
              <div className="detail-body">
                <div className="detail-grid">
                  <div className="detail-field"><div className="label">Email</div><div className="value">{selected.email || '-'}</div></div>
                  <div className="detail-field"><div className="label">Phone</div><div className="value">{selected.phone || '-'}</div></div>
                  <div className="detail-field"><div className="label">Address</div><div className="value">{selected.address || '-'}</div></div>
                  <div className="detail-field"><div className="label">City</div><div className="value">{selected.city || '-'}</div></div>
                  <div className="detail-field"><div className="label">State</div><div className="value">{selected.state || '-'}</div></div>
                  <div className="detail-field"><div className="label">Zip Code</div><div className="value">{selected.zipCode || '-'}</div></div>
                  <div className="detail-field"><div className="label">Property Type</div><div className="value">{selected.propertyType}</div></div>
                  <div className="detail-field"><div className="label">Preferred Contact</div><div className="value">{selected.preferredContact}</div></div>
                  <div className="detail-field"><div className="label">Total Spent</div><div className="value" style={{ fontSize: 20, fontWeight: 700, color: '#059669' }}>${parseFloat(selected.totalSpent || 0).toLocaleString()}</div></div>
                  <div className="detail-field"><div className="label">Job Count</div><div className="value">{selected.jobCount || 0}</div></div>
                  <div className="detail-field"><div className="label">Rating</div><div className="value" style={{ color: '#f59e0b', fontSize: 18 }}>{renderStars(selected.rating)}</div></div>
                </div>
                {selected.notes && (
                  <div className="detail-field" style={{ marginTop: 16 }}>
                    <div className="label">Notes</div>
                    <div className="value">{selected.notes}</div>
                  </div>
                )}
                <AIOutput content={aiResult} loading={aiLoading} title="AI Customer Analysis" />
              </div>
            </div>
          </>
        ) : (
          <div className="data-table-container">
            <SearchFilter
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filters={[
                { label: 'All Property Types', value: filterPropertyType, onChange: setFilterPropertyType, options: [
                  { value: 'residential', label: 'Residential' }, { value: 'commercial', label: 'Commercial' }, { value: 'industrial', label: 'Industrial' }
                ]}
              ]}
              sortOptions={[
                { value: 'name', label: 'Name A-Z' }, { value: 'spent-high', label: 'Spent: High to Low' },
                { value: 'spent-low', label: 'Spent: Low to High' }, { value: 'rating', label: 'Highest Rating' },
                { value: 'jobs', label: 'Most Jobs' }
              ]}
              sortValue={sortBy}
              onSortChange={setSortBy}
              resultCount={filteredItems.length}
              totalCount={items.length}
            />
            <div className="table-header"><h3>Customers ({filteredItems.length})</h3></div>
            <table className="data-table">
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>City</th><th>Property Type</th><th>Rating</th><th>Total Spent</th></tr></thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>No customers match your search</td></tr>
                ) : filteredItems.map(item => (
                  <tr key={item.id} onClick={() => setSelected(item)}>
                    <td className="title-cell">{item.name}</td>
                    <td>{item.email}</td>
                    <td>{item.phone}</td>
                    <td>{item.city}</td>
                    <td>{item.propertyType}</td>
                    <td style={{ color: '#f59e0b' }}>{renderStars(item.rating)}</td>
                    <td style={{ fontWeight: 600 }}>${parseFloat(item.totalSpent || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditing(false); }} title={editing ? 'Edit Customer' : 'New Customer'}
          footer={<><button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>{editing ? 'Update' : 'Create'}</button></>}>
          <div className="form-row">
            <div className="form-group"><label>Name *</label><input className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
            <div className="form-group"><label>Email</label><input className="form-control" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Phone</label><input className="form-control" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
            <div className="form-group"><label>Preferred Contact</label>
              <select className="form-control" value={formData.preferredContact} onChange={e => setFormData({...formData, preferredContact: e.target.value})}>
                <option value="phone">Phone</option><option value="email">Email</option><option value="text">Text</option>
              </select>
            </div>
          </div>
          <div className="form-group"><label>Address</label><input className="form-control" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
          <div className="form-row">
            <div className="form-group"><label>City</label><input className="form-control" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} /></div>
            <div className="form-group"><label>State</label><input className="form-control" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Zip Code</label><input className="form-control" value={formData.zipCode} onChange={e => setFormData({...formData, zipCode: e.target.value})} /></div>
            <div className="form-group"><label>Property Type</label>
              <select className="form-control" value={formData.propertyType} onChange={e => setFormData({...formData, propertyType: e.target.value})}>
                <option value="residential">Residential</option><option value="commercial">Commercial</option><option value="industrial">Industrial</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Total Spent ($)</label><input className="form-control" type="number" step="0.01" value={formData.totalSpent} onChange={e => setFormData({...formData, totalSpent: e.target.value})} /></div>
            <div className="form-group"><label>Job Count</label><input className="form-control" type="number" value={formData.jobCount} onChange={e => setFormData({...formData, jobCount: e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Rating (1-5)</label><input className="form-control" type="number" min="1" max="5" value={formData.rating} onChange={e => setFormData({...formData, rating: e.target.value})} /></div>
            <div className="form-group" />
          </div>
          <div className="form-group"><label>Notes</label><textarea className="form-control" rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
        </Modal>
      </div>
    </>
  );
}

export default Customers;
