import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import AIOutput from '../components/AIOutput';
import SearchFilter from '../components/SearchFilter';
import { ToastContext } from '../App';

const emptyQuote = {
  title: '', description: '', jobType: 'Plumbing', customerName: '', customerPhone: '',
  customerEmail: '', address: '', estimatedCost: '', laborHours: '', status: 'pending', priority: 'medium'
};

function BOMTable({ bom }) {
  if (!bom || bom.length === 0) return null;
  return (
    <div style={{ marginTop: 16 }}>
      <h4 style={{ marginBottom: 8, fontWeight: 600 }}>Material Bill of Materials</h4>
      <table className="data-table" style={{ fontSize: 13 }}>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Unit</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {bom.map((row, i) => (
            <tr key={i}>
              <td>{row.item || row.name}</td>
              <td>{row.quantity || row.qty}</td>
              <td>{row.unit || '-'}</td>
              <td>${parseFloat(row.unit_price || row.unit_cost || 0).toFixed(2)}</td>
              <td>${parseFloat(row.total || 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ComplianceBadges({ codeSections }) {
  if (!codeSections || codeSections.length === 0) return null;
  const colors = { pass: '#059669', fail: '#dc2626', warning: '#d97706' };
  return (
    <div style={{ marginTop: 16 }}>
      <h4 style={{ marginBottom: 8, fontWeight: 600 }}>Code Compliance Results</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {codeSections.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
            <span style={{ background: colors[s.status] || '#6b7280', color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{s.status}</span>
            <span style={{ fontWeight: 600 }}>{s.code} {s.section}</span>
            <span style={{ color: '#6b7280', fontSize: 13 }}>{s.requirement}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhotoAnalysisCard({ data }) {
  if (!data) return null;
  return (
    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: 16, marginTop: 16 }}>
      <h4 style={{ fontWeight: 700, marginBottom: 10, color: '#1d4ed8' }}>Photo Analysis Result</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 14 }}>
        <div><span style={{ fontWeight: 600 }}>Service Type:</span> {data.service_type}</div>
        <div><span style={{ fontWeight: 600 }}>Condition:</span> {data.condition}</div>
        <div><span style={{ fontWeight: 600 }}>Scope:</span> {data.estimated_scope}</div>
        <div><span style={{ fontWeight: 600 }}>Preliminary Cost:</span> ${data.preliminary_cost_range?.min?.toLocaleString()} - ${data.preliminary_cost_range?.max?.toLocaleString()}</div>
      </div>
      {data.equipment_identified?.length > 0 && (
        <div style={{ marginTop: 8 }}><span style={{ fontWeight: 600 }}>Equipment:</span> {data.equipment_identified.join(', ')}</div>
      )}
      {data.visible_issues?.length > 0 && (
        <div style={{ marginTop: 8 }}><span style={{ fontWeight: 600 }}>Visible Issues:</span> {data.visible_issues.join(', ')}</div>
      )}
      {data.suggested_services?.length > 0 && (
        <div style={{ marginTop: 8 }}><span style={{ fontWeight: 600 }}>Suggested Services:</span> {data.suggested_services.join(', ')}</div>
      )}
    </div>
  );
}

function JobQuotes() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyQuote);
  const [editing, setEditing] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiParsed, setAiParsed] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoAnalysis, setPhotoAnalysis] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const addToast = useContext(ToastContext);
  const photoInputRef = useRef();

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

  const fetchItems = async (p = page) => {
    try {
      const { data } = await api.get(`/job-quotes?page=${p}&limit=20`);
      // Support both paginated and legacy array responses
      if (Array.isArray(data)) {
        setItems(data);
        setTotalPages(1);
        setTotal(data.length);
      } else {
        setItems(data.quotes || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchItems(page); }, [page]);

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
      fetchItems(page);
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

  const handleCustomerAccept = async (id) => {
    if (!window.confirm('Customer accepts this quote digitally?')) return;
    try {
      const { data } = await api.put(`/job-quotes/${id}/customer-accept`);
      addToast('Quote accepted by customer');
      setSelected(data);
      fetchItems(page);
    } catch (err) {
      addToast('Failed to accept quote', 'error');
    }
  };

  const handleAIAnalyze = async (description, jobType) => {
    setAiLoading(true);
    setAiResult('');
    setAiParsed(null);
    try {
      const { data } = await api.post('/job-quotes/ai/analyze', { description, jobType });
      setAiResult(data.analysis);
      setAiParsed(data.parsed);
    } catch (err) {
      setAiResult('AI analysis failed. Please check your OpenRouter API key in .env file.');
    }
    setAiLoading(false);
  };

  const handleAnalyzeExisting = async (id) => {
    setAiLoading(true);
    setAiResult('');
    setAiParsed(null);
    try {
      const { data } = await api.post(`/job-quotes/${id}/analyze`);
      setAiResult(data.analysis);
      setAiParsed(data.parsed);
      fetchItems(page);
    } catch (err) {
      setAiResult('AI analysis failed. Please check your OpenRouter API key.');
    }
    setAiLoading(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoLoading(true);
    setPhotoAnalysis(null);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const { data } = await api.post('/job-quotes/analyze-photo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPhotoAnalysis(data.parsed);
      addToast('Photo analyzed successfully');
      fetchItems(page);
    } catch (err) {
      addToast(err.response?.data?.error || 'Photo analysis failed', 'error');
    }
    setPhotoLoading(false);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Job Quotes</h2>
          <div className="subtitle">Manage and estimate job quotes with AI assistance</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input type="file" ref={photoInputRef} accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
          <button className="btn btn-secondary" onClick={() => photoInputRef.current.click()} disabled={photoLoading}>
            {photoLoading ? 'Analyzing...' : 'Upload Site Photo'}
          </button>
          <button className="btn btn-primary" onClick={() => { setFormData(emptyQuote); setEditing(false); setShowForm(true); }}>
            + New Quote
          </button>
        </div>
      </div>

      {photoAnalysis && (
        <div style={{ padding: '0 24px' }}>
          <PhotoAnalysisCard data={photoAnalysis} />
        </div>
      )}

      <div className="page-body">
        {selected ? (
          <>
            <div className="back-link" onClick={() => { setSelected(null); setAiResult(''); setAiParsed(null); }}>
              Back to list
            </div>
            <div className="detail-view">
              <div className="detail-header">
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700 }}>{selected.title}</h3>
                  <span className={`badge badge-${selected.status}`}>{selected.status}</span>
                  {' '}
                  <span className={`badge badge-${selected.priority}`}>{selected.priority} priority</span>
                  {selected.customerSignature && (
                    <span style={{ marginLeft: 8, background: '#059669', color: '#fff', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Digitally Accepted</span>
                  )}
                </div>
                <div className="btn-group">
                  <button className="btn btn-ai" onClick={() => handleAnalyzeExisting(selected.id)}>
                    AI Analyze
                  </button>
                  {selected.status !== 'accepted' && (
                    <button className="btn btn-primary" onClick={() => handleCustomerAccept(selected.id)}>
                      Customer Accept
                    </button>
                  )}
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
                  {selected.acceptedAt && (
                    <div className="detail-field">
                      <div className="label">Accepted At</div>
                      <div className="value">{new Date(selected.acceptedAt).toLocaleString()}</div>
                    </div>
                  )}
                </div>
                <div className="detail-field" style={{ marginTop: 16 }}>
                  <div className="label">Description</div>
                  <div className="value" style={{ lineHeight: 1.6 }}>{selected.description}</div>
                </div>

                {/* Show BOM if AI parsed has materials */}
                {aiParsed?.materials && <BOMTable bom={aiParsed.materials} />}
                {aiParsed?.bill_of_materials && <BOMTable bom={aiParsed.bill_of_materials} />}

                {/* Show code compliance badges */}
                {aiParsed?.code_sections && <ComplianceBadges codeSections={aiParsed.code_sections} />}

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
                  { value: 'in_progress', label: 'In Progress' }, { value: 'completed', label: 'Completed' },
                  { value: 'accepted', label: 'Accepted' }
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
              totalCount={total}
            />
            <div className="table-header">
              <h3>Quotes ({total})</h3>
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: '16px 0' }}>
                <button className="btn btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  Previous
                </button>
                <span style={{ fontSize: 14, color: '#6b7280' }}>Page {page} of {totalPages}</span>
                <button className="btn btn-secondary" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        <Modal
          isOpen={showForm}
          onClose={() => { setShowForm(false); setEditing(false); setAiResult(''); setAiParsed(null); }}
          title={editing ? 'Edit Quote' : 'New Job Quote'}
          footer={
            <>
              <button className="btn btn-ai" onClick={() => handleAIAnalyze(formData.description, formData.jobType)} disabled={!formData.description}>
                AI Estimate
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

          {/* Show BOM table if AI parsed materials */}
          {aiParsed?.materials && <BOMTable bom={aiParsed.materials} />}
          {aiParsed?.bill_of_materials && <BOMTable bom={aiParsed.bill_of_materials} />}
          {aiParsed?.code_sections && <ComplianceBadges codeSections={aiParsed.code_sections} />}

          <AIOutput content={aiResult} loading={aiLoading} title="AI Job Estimate" />
        </Modal>
      </div>
    </>
  );
}

export default JobQuotes;
