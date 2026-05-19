import React, { useState, useContext } from 'react';
import api from '../services/api';
import AIOutput from '../components/AIOutput';
import { ToastContext } from '../App';

const emptyForm = {
  jobType: 'Plumbing',
  description: '',
  laborHours: '',
  markupPct: '',
  taxPct: '',
};

function QuoteEstimateAI() {
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [parsed, setParsed] = useState(null);
  const addToast = useContext(ToastContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.jobType) {
      addToast('Please describe the job and select a type', 'error');
      return;
    }
    setLoading(true);
    setContent('');
    setParsed(null);
    try {
      const payload = {
        jobType: formData.jobType,
        description: formData.description,
      };
      if (formData.laborHours) payload.laborHours = Number(formData.laborHours);
      if (formData.markupPct !== '') payload.markupPct = Number(formData.markupPct);
      if (formData.taxPct !== '') payload.taxPct = Number(formData.taxPct);

      const { data } = await api.post('/ai/quote-estimate-ai', payload);
      setContent(data.estimation || data.content || '');
      setParsed(data.parsed || null);
      addToast('AI quote generated!');
    } catch (err) {
      addToast(
        err.response?.data?.error ||
          err.response?.data?.errors?.[0]?.msg ||
          'Failed to generate quote',
        'error'
      );
    }
    setLoading(false);
  };

  const items = parsed?.line_items || parsed?.items || [];
  const labor = parsed?.labor || {};
  const totals = parsed?.totals || {};

  return (
    <>
      <div className="page-header">
        <div>
          <h2>AI Quote Estimator</h2>
          <div className="subtitle">Itemized job quote: materials + labor + markup + tax</div>
        </div>
      </div>
      <div className="page-body">
        <div className="data-table-container" style={{ marginBottom: 24 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Job Type *</label>
                <select
                  className="form-control"
                  value={formData.jobType}
                  onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                >
                  <option>Plumbing</option>
                  <option>Electrical</option>
                  <option>HVAC</option>
                  <option>Multi-Trade</option>
                </select>
              </div>
              <div className="form-group">
                <label>Estimated Labor Hours</label>
                <input
                  className="form-control"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.laborHours}
                  onChange={(e) => setFormData({ ...formData, laborHours: e.target.value })}
                  placeholder="e.g., 12"
                />
              </div>
              <div className="form-group">
                <label>Markup %</label>
                <input
                  className="form-control"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.markupPct}
                  onChange={(e) => setFormData({ ...formData, markupPct: e.target.value })}
                  placeholder="e.g., 25"
                />
              </div>
              <div className="form-group">
                <label>Tax %</label>
                <input
                  className="form-control"
                  type="number"
                  min="0"
                  step="0.25"
                  value={formData.taxPct}
                  onChange={(e) => setFormData({ ...formData, taxPct: e.target.value })}
                  placeholder="e.g., 8.875"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Job Description *</label>
              <textarea
                className="form-control"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the job: scope, fixtures, materials, site conditions, access constraints..."
                required
              />
            </div>
            <button type="submit" className="btn btn-ai" disabled={loading}>
              {loading ? '⏳ Generating...' : '🤖 Generate AI Quote'}
            </button>
          </form>
        </div>

        {parsed && items.length > 0 && (
          <div className="data-table-container" style={{ marginBottom: 24 }}>
            <div className="table-header">
              <h3>Itemized Quote</h3>
              {totals.grand_total !== undefined && (
                <span style={{ fontWeight: 700, color: '#059669', fontSize: 18 }}>
                  Grand Total: ${parseFloat(totals.grand_total || 0).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              )}
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
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="title-cell">{item.item || item.name || item.description}</td>
                    <td>{item.quantity ?? item.qty ?? '-'}</td>
                    <td>{item.unit || '-'}</td>
                    <td>${parseFloat(item.unit_price || item.unitPrice || 0).toFixed(2)}</td>
                    <td style={{ fontWeight: 600, color: '#059669' }}>
                      ${parseFloat(item.total || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(labor.hours !== undefined || totals.labor_total !== undefined) && (
              <div style={{ padding: '12px 16px', color: '#374151', fontSize: 13 }}>
                Labor: {labor.hours || '-'} hrs @ ${labor.rate || '-'}/hr
                {totals.labor_total !== undefined && (
                  <> = <strong>${parseFloat(totals.labor_total || 0).toFixed(2)}</strong></>
                )}
              </div>
            )}
            {totals.markup !== undefined && (
              <div style={{ padding: '4px 16px', color: '#6b7280', fontSize: 13 }}>
                Markup: ${parseFloat(totals.markup || 0).toFixed(2)} &middot; Tax: $
                {parseFloat(totals.tax || 0).toFixed(2)}
              </div>
            )}
          </div>
        )}

        <AIOutput content={content} loading={loading} title="AI Quote Analysis" />
      </div>
    </>
  );
}

export default QuoteEstimateAI;
