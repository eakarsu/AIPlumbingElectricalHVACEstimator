import React, { useState, useEffect, useContext, useMemo } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import AIOutput from '../components/AIOutput';
import SearchFilter from '../components/SearchFilter';
import { ToastContext } from '../App';

const emptyItem = {
  invoiceNumber: '', customerName: '', customerEmail: '', customerPhone: '', customerAddress: '',
  jobDescription: '', laborCost: '', materialCost: '', taxRate: 8.5, status: 'draft', dueDate: '', notes: ''
};

function Invoices() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyItem);
  const [editing, setEditing] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const addToast = useContext(ToastContext);

  const filteredItems = useMemo(() => {
    let result = items.filter(item => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = !search ||
        item.invoiceNumber?.toLowerCase().includes(search) ||
        item.customerName?.toLowerCase().includes(search) ||
        item.jobDescription?.toLowerCase().includes(search) ||
        item.customerEmail?.toLowerCase().includes(search);
      const matchesStatus = !filterStatus || item.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest': return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'oldest': return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case 'amount-high': return parseFloat(b.totalAmount || 0) - parseFloat(a.totalAmount || 0);
        case 'amount-low': return parseFloat(a.totalAmount || 0) - parseFloat(b.totalAmount || 0);
        case 'due-date': return new Date(a.dueDate || '9999') - new Date(b.dueDate || '9999');
        default: return 0;
      }
    });
    return result;
  }, [items, searchTerm, filterStatus, sortBy]);

  const handlePrint = () => window.print();

  const fetchItems = async () => {
    try { const { data } = await api.get('/invoices'); setItems(data); } catch (err) { console.error(err); }
  };
  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    try {
      if (editing) { await api.put(`/invoices/${formData.id}`, formData); addToast('Invoice updated'); }
      else {
        if (!formData.invoiceNumber) {
          formData.invoiceNumber = `INV-${new Date().getFullYear()}-${String(items.length + 1).padStart(3, '0')}`;
        }
        await api.post('/invoices', formData);
        addToast('Invoice created');
      }
      setShowForm(false); setFormData(emptyItem); setEditing(false); fetchItems();
    } catch (err) { addToast(err.response?.data?.error || 'Failed to save', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice?')) return;
    try { await api.delete(`/invoices/${id}`); addToast('Invoice deleted'); setSelected(null); fetchItems(); }
    catch (err) { addToast('Failed to delete', 'error'); }
  };

  const handleEdit = (item) => { setFormData(item); setEditing(true); setShowForm(true); setSelected(null); };

  const handleAIAnalyze = async (id) => {
    setAiLoading(true); setAiResult('');
    try {
      const { data } = await api.post(`/invoices/${id}/analyze`);
      setAiResult(data.analysis);
    } catch (err) { setAiResult('AI analysis failed. Please check your OpenRouter API key.'); }
    setAiLoading(false);
  };

  const totals = {
    total: items.reduce((s, i) => s + parseFloat(i.totalAmount || 0), 0),
    paid: items.filter(i => i.status === 'paid').reduce((s, i) => s + parseFloat(i.totalAmount || 0), 0),
    pending: items.filter(i => ['sent', 'draft'].includes(i.status)).reduce((s, i) => s + parseFloat(i.totalAmount || 0), 0),
    overdue: items.filter(i => i.status === 'overdue').reduce((s, i) => s + parseFloat(i.totalAmount || 0), 0),
  };

  return (
    <>
      <div className="page-header">
        <div><h2>Invoicing</h2><div className="subtitle">Manage invoices and billing with AI insights</div></div>
        <button className="btn btn-primary" onClick={() => { setFormData(emptyItem); setEditing(false); setShowForm(true); }}>+ New Invoice</button>
      </div>
      <div className="page-body">
        {/* Invoice Summary */}
        <div className="dashboard-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card"><div className="stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>💰</div><div className="stat-value">${totals.total.toLocaleString()}</div><div className="stat-label">Total Invoiced</div></div>
          <div className="stat-card"><div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>✅</div><div className="stat-value">${totals.paid.toLocaleString()}</div><div className="stat-label">Paid</div></div>
          <div className="stat-card"><div className="stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}>⏳</div><div className="stat-value">${totals.pending.toLocaleString()}</div><div className="stat-label">Pending</div></div>
          <div className="stat-card"><div className="stat-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>⚠️</div><div className="stat-value">${totals.overdue.toLocaleString()}</div><div className="stat-label">Overdue</div></div>
        </div>

        {selected ? (
          <>
            <div className="back-link" onClick={() => { setSelected(null); setAiResult(''); }}>← Back to list</div>
            <div className="detail-view">
              <div className="detail-header">
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700 }}>{selected.invoiceNumber}</h3>
                  <span className={`badge badge-${selected.status}`}>{selected.status}</span>
                </div>
                <div className="btn-group">
                  <button className="btn btn-secondary" onClick={handlePrint}>🖨️ Print</button>
                  <button className="btn btn-ai" onClick={() => handleAIAnalyze(selected.id)}>📈 AI Analyze</button>
                  <button className="btn btn-secondary" onClick={() => handleEdit(selected)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(selected.id)}>Delete</button>
                </div>
              </div>
              <div className="detail-body">
                <div className="detail-grid">
                  <div className="detail-field"><div className="label">Customer</div><div className="value">{selected.customerName}</div></div>
                  <div className="detail-field"><div className="label">Email</div><div className="value">{selected.customerEmail || '-'}</div></div>
                  <div className="detail-field"><div className="label">Phone</div><div className="value">{selected.customerPhone || '-'}</div></div>
                  <div className="detail-field"><div className="label">Address</div><div className="value">{selected.customerAddress || '-'}</div></div>
                  <div className="detail-field"><div className="label">Due Date</div><div className="value">{selected.dueDate || '-'}</div></div>
                  {selected.paidDate && <div className="detail-field"><div className="label">Paid Date</div><div className="value" style={{ color: '#059669' }}>{selected.paidDate}</div></div>}
                </div>
                <div className="detail-field" style={{ marginTop: 16 }}><div className="label">Job Description</div><div className="value">{selected.jobDescription}</div></div>

                {/* Invoice Breakdown */}
                <div style={{ marginTop: 24, background: '#f9fafb', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Invoice Breakdown</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                    <span>Labor Cost</span><span style={{ fontWeight: 600 }}>${parseFloat(selected.laborCost || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                    <span>Material Cost</span><span style={{ fontWeight: 600 }}>${parseFloat(selected.materialCost || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                    <span>Subtotal</span><span style={{ fontWeight: 600 }}>${(parseFloat(selected.laborCost || 0) + parseFloat(selected.materialCost || 0)).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                    <span>Tax ({selected.taxRate}%)</span><span style={{ fontWeight: 600 }}>${parseFloat(selected.taxAmount || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: 18, fontWeight: 800, color: '#059669' }}>
                    <span>Total</span><span>${parseFloat(selected.totalAmount || 0).toLocaleString()}</span>
                  </div>
                </div>

                {selected.notes && <div className="detail-field" style={{ marginTop: 16 }}><div className="label">Notes</div><div className="value">{selected.notes}</div></div>}
                <AIOutput content={aiResult} loading={aiLoading} title="AI Invoice Analysis" />
              </div>
            </div>

            {/* Print View - only visible when printing */}
            <div className="print-view">
              <div className="invoice-header">
                <div className="company-info">
                  <h2>Your Company Name</h2>
                  <p>Plumbing, Electrical & HVAC Services</p>
                </div>
                <div className="invoice-info">
                  <h3>INVOICE</h3>
                  <p>{selected.invoiceNumber}</p>
                  <p>Due: {selected.dueDate || 'N/A'}</p>
                  <p>Status: {selected.status}</p>
                </div>
              </div>
              <div style={{ marginBottom: 24 }}>
                <strong>Bill To:</strong><br />
                {selected.customerName}<br />
                {selected.customerEmail && <>{selected.customerEmail}<br /></>}
                {selected.customerPhone && <>{selected.customerPhone}<br /></>}
                {selected.customerAddress && <>{selected.customerAddress}<br /></>}
              </div>
              <table>
                <thead><tr><th>Description</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
                <tbody>
                  <tr><td>{selected.jobDescription}</td><td></td></tr>
                  <tr><td>Labor</td><td style={{ textAlign: 'right' }}>${parseFloat(selected.laborCost || 0).toFixed(2)}</td></tr>
                  <tr><td>Materials</td><td style={{ textAlign: 'right' }}>${parseFloat(selected.materialCost || 0).toFixed(2)}</td></tr>
                </tbody>
              </table>
              <div className="totals">
                <div className="total-row"><span>Subtotal:</span><span>${(parseFloat(selected.laborCost || 0) + parseFloat(selected.materialCost || 0)).toFixed(2)}</span></div>
                <div className="total-row"><span>Tax ({selected.taxRate}%):</span><span>${parseFloat(selected.taxAmount || 0).toFixed(2)}</span></div>
                <div className="total-row grand-total"><span>Total:</span><span>${parseFloat(selected.totalAmount || 0).toFixed(2)}</span></div>
              </div>
              {selected.notes && <div style={{ marginTop: 32, fontSize: 12, color: '#666' }}><strong>Notes:</strong> {selected.notes}</div>}
              </div>
            </div>
          </>
        ) : (
          <div className="data-table-container">
            <SearchFilter
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filters={[
                { label: 'All Statuses', value: filterStatus, onChange: setFilterStatus, options: [
                  { value: 'draft', label: 'Draft' }, { value: 'sent', label: 'Sent' },
                  { value: 'paid', label: 'Paid' }, { value: 'overdue', label: 'Overdue' }
                ]}
              ]}
              sortOptions={[
                { value: 'newest', label: 'Newest First' }, { value: 'oldest', label: 'Oldest First' },
                { value: 'amount-high', label: 'Amount: High to Low' }, { value: 'amount-low', label: 'Amount: Low to High' },
                { value: 'due-date', label: 'Due Date' }
              ]}
              sortValue={sortBy}
              onSortChange={setSortBy}
              resultCount={filteredItems.length}
              totalCount={items.length}
            />
            <div className="table-header"><h3>Invoices ({filteredItems.length})</h3></div>
            <table className="data-table">
              <thead><tr><th>Invoice #</th><th>Customer</th><th>Description</th><th>Total</th><th>Due Date</th><th>Status</th></tr></thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>No invoices match your search</td></tr>
                ) : filteredItems.map(item => (
                  <tr key={item.id} onClick={() => setSelected(item)}>
                    <td className="title-cell">{item.invoiceNumber}</td>
                    <td>{item.customerName}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.jobDescription}</td>
                    <td style={{ fontWeight: 700, color: '#059669' }}>${parseFloat(item.totalAmount || 0).toLocaleString()}</td>
                    <td>{item.dueDate}</td>
                    <td><span className={`badge badge-${item.status}`}>{item.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditing(false); }} title={editing ? 'Edit Invoice' : 'New Invoice'}
          footer={<><button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>{editing ? 'Update' : 'Create'}</button></>}>
          <div className="form-row">
            <div className="form-group"><label>Invoice Number</label><input className="form-control" value={formData.invoiceNumber} onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} placeholder="Auto-generated if empty" /></div>
            <div className="form-group"><label>Status</label><select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}><option value="draft">Draft</option><option value="sent">Sent</option><option value="paid">Paid</option><option value="overdue">Overdue</option></select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Customer Name *</label><input className="form-control" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} /></div>
            <div className="form-group"><label>Customer Email</label><input className="form-control" type="email" value={formData.customerEmail} onChange={e => setFormData({...formData, customerEmail: e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Customer Phone</label><input className="form-control" value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} /></div>
            <div className="form-group"><label>Customer Address</label><input className="form-control" value={formData.customerAddress} onChange={e => setFormData({...formData, customerAddress: e.target.value})} /></div>
          </div>
          <div className="form-group"><label>Job Description *</label><textarea className="form-control" rows={3} value={formData.jobDescription} onChange={e => setFormData({...formData, jobDescription: e.target.value})} /></div>
          <div className="form-row">
            <div className="form-group"><label>Labor Cost ($)</label><input className="form-control" type="number" step="0.01" value={formData.laborCost} onChange={e => setFormData({...formData, laborCost: e.target.value})} /></div>
            <div className="form-group"><label>Material Cost ($)</label><input className="form-control" type="number" step="0.01" value={formData.materialCost} onChange={e => setFormData({...formData, materialCost: e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Tax Rate (%)</label><input className="form-control" type="number" step="0.01" value={formData.taxRate} onChange={e => setFormData({...formData, taxRate: e.target.value})} /></div>
            <div className="form-group"><label>Due Date</label><input className="form-control" type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} /></div>
          </div>
          <div className="form-group"><label>Notes</label><textarea className="form-control" rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
          {/* Preview */}
          {(formData.laborCost || formData.materialCost) && (
            <div style={{ background: '#f0f4ff', padding: 16, borderRadius: 8, marginTop: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Preview:</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>Subtotal:</span><span>${(parseFloat(formData.laborCost || 0) + parseFloat(formData.materialCost || 0)).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>Tax ({formData.taxRate}%):</span><span>${((parseFloat(formData.laborCost || 0) + parseFloat(formData.materialCost || 0)) * parseFloat(formData.taxRate || 0) / 100).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, marginTop: 8, color: '#059669' }}>
                <span>Total:</span><span>${((parseFloat(formData.laborCost || 0) + parseFloat(formData.materialCost || 0)) * (1 + parseFloat(formData.taxRate || 0) / 100)).toFixed(2)}</span>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  );
}

export default Invoices;
