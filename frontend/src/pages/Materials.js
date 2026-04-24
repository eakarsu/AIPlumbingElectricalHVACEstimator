import React, { useState, useEffect, useContext, useMemo } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import AIOutput from '../components/AIOutput';
import SearchFilter from '../components/SearchFilter';
import { ToastContext } from '../App';

const emptyItem = {
  name: '', category: 'Plumbing', description: '', unit: 'each', unitPrice: '',
  quantity: '', supplier: '', sku: '', inStock: true, minOrderQty: 1, leadTimeDays: 1
};

function Materials() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyItem);
  const [editing, setEditing] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDesc, setAiDesc] = useState('');
  const [aiJobType, setAiJobType] = useState('Plumbing');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStock, setFilterStock] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const addToast = useContext(ToastContext);

  const filteredItems = useMemo(() => {
    let result = items.filter(item => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = !search ||
        item.name?.toLowerCase().includes(search) ||
        item.supplier?.toLowerCase().includes(search) ||
        item.sku?.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search);
      const matchesCategory = !filterCategory || item.category === filterCategory;
      const matchesStock = !filterStock ||
        (filterStock === 'in-stock' && item.inStock) ||
        (filterStock === 'out-of-stock' && !item.inStock) ||
        (filterStock === 'low-stock' && item.inStock && parseInt(item.quantity || 0) <= parseInt(item.minOrderQty || 5));
      return matchesSearch && matchesCategory && matchesStock;
    });
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name': return (a.name || '').localeCompare(b.name || '');
        case 'price-high': return parseFloat(b.unitPrice || 0) - parseFloat(a.unitPrice || 0);
        case 'price-low': return parseFloat(a.unitPrice || 0) - parseFloat(b.unitPrice || 0);
        case 'qty-low': return parseInt(a.quantity || 0) - parseInt(b.quantity || 0);
        case 'qty-high': return parseInt(b.quantity || 0) - parseInt(a.quantity || 0);
        default: return 0;
      }
    });
    return result;
  }, [items, searchTerm, filterCategory, filterStock, sortBy]);

  const lowStockItems = useMemo(() =>
    items.filter(item => item.inStock && parseInt(item.quantity || 0) <= parseInt(item.minOrderQty || 5)),
    [items]
  );

  const outOfStockItems = useMemo(() => items.filter(item => !item.inStock), [items]);

  const totalInventoryValue = useMemo(() =>
    items.reduce((sum, item) => sum + (parseFloat(item.unitPrice || 0) * parseInt(item.quantity || 0)), 0),
    [items]
  );

  const fetchItems = async () => {
    try { const { data } = await api.get('/materials'); setItems(data); } catch (err) { console.error(err); }
  };
  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    try {
      if (editing) {
        await api.put(`/materials/${formData.id}`, formData);
        addToast('Material updated');
      } else {
        await api.post('/materials', formData);
        addToast('Material created');
      }
      setShowForm(false); setFormData(emptyItem); setEditing(false); fetchItems();
    } catch (err) { addToast(err.response?.data?.error || 'Failed to save', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this material?')) return;
    try { await api.delete(`/materials/${id}`); addToast('Material deleted'); setSelected(null); fetchItems(); }
    catch (err) { addToast('Failed to delete', 'error'); }
  };

  const handleEdit = (item) => { setFormData(item); setEditing(true); setShowForm(true); setSelected(null); };

  const handleAIEstimate = async () => {
    if (!aiDesc) return;
    setAiLoading(true); setAiResult('');
    try {
      const { data } = await api.post('/materials/ai/estimate', { description: aiDesc, jobType: aiJobType });
      setAiResult(data.estimation);
    } catch (err) { setAiResult('AI estimation failed. Please check your OpenRouter API key.'); }
    setAiLoading(false);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Materials & Pricing</h2>
          <div className="subtitle">Manage inventory and get AI material estimates</div>
        </div>
        <div className="btn-group">
          <button className="btn btn-primary" onClick={() => { setFormData(emptyItem); setEditing(false); setShowForm(true); }}>+ New Material</button>
        </div>
      </div>
      <div className="page-body">
        {/* AI Material Estimator */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            🤖 AI Material Estimator
          </h3>
          <div className="form-row">
            <div className="form-group">
              <label>Project Description</label>
              <textarea className="form-control" rows={3} value={aiDesc} onChange={e => setAiDesc(e.target.value)} placeholder="Describe the project to get a material estimate..." />
            </div>
            <div>
              <div className="form-group">
                <label>Job Type</label>
                <select className="form-control" value={aiJobType} onChange={e => setAiJobType(e.target.value)}>
                  <option>Plumbing</option><option>Electrical</option><option>HVAC</option>
                </select>
              </div>
              <button className="btn btn-ai" style={{ width: '100%' }} onClick={handleAIEstimate} disabled={!aiDesc || aiLoading}>
                🧠 Estimate Materials
              </button>
            </div>
          </div>
          <AIOutput content={aiResult} loading={aiLoading} title="AI Material Estimate" />
        </div>

        {/* Inventory Summary Stats */}
        <div className="dashboard-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>📦</div>
            <div className="stat-value">{items.length}</div>
            <div className="stat-label">Total Materials</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>💲</div>
            <div className="stat-value">${totalInventoryValue.toLocaleString()}</div>
            <div className="stat-label">Total Inventory Value</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: lowStockItems.length > 0 ? '#fef3c7' : '#ecfdf5', color: lowStockItems.length > 0 ? '#d97706' : '#059669' }}>
              {lowStockItems.length > 0 ? '⚠️' : '✅'}
            </div>
            <div className="stat-value">{lowStockItems.length}</div>
            <div className="stat-label">Low Stock Items</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: outOfStockItems.length > 0 ? '#fee2e2' : '#ecfdf5', color: outOfStockItems.length > 0 ? '#dc2626' : '#059669' }}>
              {outOfStockItems.length > 0 ? '🚫' : '✅'}
            </div>
            <div className="stat-value">{outOfStockItems.length}</div>
            <div className="stat-label">Out of Stock</div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        {outOfStockItems.length > 0 && (
          <div className="alert-banner alert-banner-danger">
            <span className="alert-icon">🚫</span>
            <span><strong>{outOfStockItems.length} item{outOfStockItems.length > 1 ? 's' : ''} out of stock:</strong> {outOfStockItems.map(i => i.name).join(', ')}</span>
          </div>
        )}
        {lowStockItems.length > 0 && (
          <div className="alert-banner alert-banner-warning">
            <span className="alert-icon">⚠️</span>
            <span><strong>{lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} running low:</strong> {lowStockItems.map(i => `${i.name} (${i.quantity} left)`).join(', ')}</span>
          </div>
        )}

        {selected ? (
          <>
            <div className="back-link" onClick={() => setSelected(null)}>← Back to list</div>
            <div className="detail-view">
              <div className="detail-header">
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700 }}>{selected.name}</h3>
                  <span className={`badge badge-${selected.category?.toLowerCase()}`} style={{ background: '#e0e7ff', color: '#3730a3' }}>{selected.category}</span>
                  {' '}
                  {selected.inStock ? <span className="badge badge-active">In Stock</span> : <span className="badge badge-overdue">Out of Stock</span>}
                </div>
                <div className="btn-group">
                  <button className="btn btn-secondary" onClick={() => handleEdit(selected)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(selected.id)}>Delete</button>
                </div>
              </div>
              <div className="detail-body">
                <div className="detail-grid">
                  <div className="detail-field"><div className="label">Category</div><div className="value">{selected.category}</div></div>
                  <div className="detail-field"><div className="label">Unit</div><div className="value">{selected.unit}</div></div>
                  <div className="detail-field"><div className="label">Unit Price</div><div className="value" style={{ fontSize: 20, fontWeight: 700, color: '#059669' }}>${parseFloat(selected.unitPrice || 0).toFixed(2)}</div></div>
                  <div className="detail-field"><div className="label">Quantity in Stock</div><div className="value">{selected.quantity}</div></div>
                  <div className="detail-field"><div className="label">Supplier</div><div className="value">{selected.supplier || '-'}</div></div>
                  <div className="detail-field"><div className="label">SKU</div><div className="value">{selected.sku || '-'}</div></div>
                  <div className="detail-field"><div className="label">Min Order Qty</div><div className="value">{selected.minOrderQty}</div></div>
                  <div className="detail-field"><div className="label">Lead Time</div><div className="value">{selected.leadTimeDays} days</div></div>
                </div>
                {selected.description && (
                  <div className="detail-field" style={{ marginTop: 16 }}>
                    <div className="label">Description</div>
                    <div className="value">{selected.description}</div>
                  </div>
                )}
                <div className="detail-field" style={{ marginTop: 16 }}>
                  <div className="label">Total Inventory Value</div>
                  <div className="value" style={{ fontSize: 24, fontWeight: 800, color: '#1a56db' }}>
                    ${(parseFloat(selected.unitPrice || 0) * (selected.quantity || 0)).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="data-table-container">
            <SearchFilter
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filters={[
                { label: 'All Categories', value: filterCategory, onChange: setFilterCategory, options: ['Plumbing', 'Electrical', 'HVAC'] },
                { label: 'All Stock Status', value: filterStock, onChange: setFilterStock, options: [
                  { value: 'in-stock', label: 'In Stock' }, { value: 'out-of-stock', label: 'Out of Stock' }, { value: 'low-stock', label: 'Low Stock' }
                ]}
              ]}
              sortOptions={[
                { value: 'name', label: 'Name A-Z' }, { value: 'price-high', label: 'Price: High to Low' },
                { value: 'price-low', label: 'Price: Low to High' }, { value: 'qty-low', label: 'Qty: Low to High' },
                { value: 'qty-high', label: 'Qty: High to Low' }
              ]}
              sortValue={sortBy}
              onSortChange={setSortBy}
              resultCount={filteredItems.length}
              totalCount={items.length}
            />
            <div className="table-header"><h3>Materials ({filteredItems.length})</h3></div>
            <table className="data-table">
              <thead><tr><th>Name</th><th>Category</th><th>Unit Price</th><th>Qty</th><th>Supplier</th><th>Status</th></tr></thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>No materials match your search</td></tr>
                ) : filteredItems.map(item => (
                  <tr key={item.id} onClick={() => setSelected(item)}>
                    <td className="title-cell">{item.name}</td>
                    <td>{item.category}</td>
                    <td style={{ fontWeight: 600 }}>${parseFloat(item.unitPrice || 0).toFixed(2)}</td>
                    <td style={{ color: item.inStock && parseInt(item.quantity || 0) <= parseInt(item.minOrderQty || 5) ? '#d97706' : 'inherit', fontWeight: item.inStock && parseInt(item.quantity || 0) <= parseInt(item.minOrderQty || 5) ? 700 : 400 }}>
                      {item.quantity} {item.unit}
                    </td>
                    <td>{item.supplier}</td>
                    <td>{item.inStock ? <span className="badge badge-active">In Stock</span> : <span className="badge badge-overdue">Out of Stock</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditing(false); }} title={editing ? 'Edit Material' : 'New Material'}
          footer={<><button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>{editing ? 'Update' : 'Create'}</button></>}>
          <div className="form-row">
            <div className="form-group"><label>Name *</label><input className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
            <div className="form-group"><label>Category *</label>
              <select className="form-control" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option>Plumbing</option><option>Electrical</option><option>HVAC</option>
              </select>
            </div>
          </div>
          <div className="form-group"><label>Description</label><textarea className="form-control" rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
          <div className="form-row">
            <div className="form-group"><label>Unit *</label><input className="form-control" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} placeholder="each, roll, linear ft" /></div>
            <div className="form-group"><label>Unit Price ($) *</label><input className="form-control" type="number" step="0.01" value={formData.unitPrice} onChange={e => setFormData({...formData, unitPrice: e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Quantity</label><input className="form-control" type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} /></div>
            <div className="form-group"><label>Supplier</label><input className="form-control" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>SKU</label><input className="form-control" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} /></div>
            <div className="form-group"><label>Lead Time (days)</label><input className="form-control" type="number" value={formData.leadTimeDays} onChange={e => setFormData({...formData, leadTimeDays: e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Min Order Qty</label><input className="form-control" type="number" value={formData.minOrderQty} onChange={e => setFormData({...formData, minOrderQty: e.target.value})} /></div>
            <div className="form-group"><label>In Stock</label>
              <select className="form-control" value={formData.inStock} onChange={e => setFormData({...formData, inStock: e.target.value === 'true'})}>
                <option value="true">Yes</option><option value="false">No</option>
              </select>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
}

export default Materials;
