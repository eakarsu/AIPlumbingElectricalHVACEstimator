import React, { useState, useContext } from 'react';
import api from '../services/api';
import AIOutput from '../components/AIOutput';
import { ToastContext } from '../App';

const emptyForm = {
  jobType: 'Plumbing',
  description: '',
  area: '',
  units: 'sq ft'
};

function MaterialEstimate() {
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [parsed, setParsed] = useState(null);
  const addToast = useContext(ToastContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.jobType) {
      addToast('Please fill in required fields', 'error');
      return;
    }
    setLoading(true);
    setResult(null);
    setParsed(null);
    try {
      const { data } = await api.post('/ai/material-estimate', formData);
      setResult(data.estimation);
      setParsed(data.parsed);
      addToast('Material estimate generated!');
    } catch (err) {
      addToast(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to generate estimate', 'error');
    }
    setLoading(false);
  };

  const bom = parsed?.bill_of_materials || [];
  const totalCost = parsed?.total_materials_cost || 0;

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Material Cost Estimator</h2>
          <div className="subtitle">AI-powered itemized material lists with quantities and unit costs</div>
        </div>
      </div>
      <div className="page-body">
        <div className="data-table-container" style={{ marginBottom: 24 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Job Type *</label>
                <select className="form-control" value={formData.jobType} onChange={e => setFormData({ ...formData, jobType: e.target.value })}>
                  <option>Plumbing</option>
                  <option>Electrical</option>
                  <option>HVAC</option>
                  <option>Multi-Trade</option>
                </select>
              </div>
              <div className="form-group">
                <label>Area / Quantity</label>
                <input className="form-control" type="number" min="0" value={formData.area} onChange={e => setFormData({ ...formData, area: e.target.value })} placeholder="e.g., 1500" />
              </div>
              <div className="form-group">
                <label>Units</label>
                <select className="form-control" value={formData.units} onChange={e => setFormData({ ...formData, units: e.target.value })}>
                  <option value="sq ft">sq ft</option>
                  <option value="linear ft">linear ft</option>
                  <option value="units">units</option>
                  <option value="rooms">rooms</option>
                  <option value="floors">floors</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Project Description *</label>
              <textarea
                className="form-control"
                rows={4}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the project in detail - e.g., Replace main water line from street to house, 3/4 inch copper pipe, approximately 80 linear feet..."
                required
              />
            </div>
            <button type="submit" className="btn btn-ai" disabled={loading}>
              {loading ? '⏳ Generating...' : '🤖 Generate Material Estimate'}
            </button>
          </form>
        </div>

        {parsed && bom.length > 0 && (
          <div className="data-table-container" style={{ marginBottom: 24 }}>
            <div className="table-header">
              <h3>Bill of Materials</h3>
              <span style={{ fontWeight: 700, color: '#059669', fontSize: 18 }}>
                Total: ${parseFloat(totalCost).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {bom.map((item, idx) => (
                  <tr key={idx}>
                    <td className="title-cell">{item.item}</td>
                    <td>{item.quantity}</td>
                    <td>{item.unit || '-'}</td>
                    <td>${parseFloat(item.unit_price || 0).toFixed(2)}</td>
                    <td style={{ fontWeight: 600, color: '#059669' }}>${parseFloat(item.total || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 700, background: '#f9fafb' }}>
                  <td colSpan={4} style={{ textAlign: 'right', padding: '12px 16px' }}>Grand Total</td>
                  <td style={{ color: '#059669', fontSize: 16, padding: '12px 16px' }}>${parseFloat(totalCost).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            {parsed.lead_time_days && (
              <div style={{ padding: '12px 16px', color: '#6b7280', fontSize: 13 }}>
                Estimated lead time: {parsed.lead_time_days} days
              </div>
            )}
          </div>
        )}

        <AIOutput content={result} loading={loading} title="AI Material Analysis" />
      </div>
    </>
  );
}

export default MaterialEstimate;
