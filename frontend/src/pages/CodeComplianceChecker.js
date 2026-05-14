import React, { useState, useContext } from 'react';
import api from '../services/api';
import AIOutput from '../components/AIOutput';
import { ToastContext } from '../App';

const emptyForm = {
  workType: 'Plumbing',
  workDescription: '',
  jurisdiction: ''
};

const statusColors = { compliant: '#059669', non_compliant: '#dc2626', review_needed: '#d97706', needs_review: '#d97706' };

function CodeComplianceChecker() {
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [parsed, setParsed] = useState(null);
  const addToast = useContext(ToastContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.workDescription || !formData.jurisdiction) {
      addToast('Please fill in all required fields', 'error');
      return;
    }
    setLoading(true);
    setResult(null);
    setParsed(null);
    try {
      const { data } = await api.post('/ai/code-compliance', formData);
      setResult(data.compliance);
      setParsed(data.parsed);
      addToast('Code compliance check complete!');
    } catch (err) {
      addToast(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to check compliance', 'error');
    }
    setLoading(false);
  };

  const overallStatus = parsed?.overall_status || '';
  const codes = parsed?.applicable_codes || [];
  const permits = parsed?.required_permits || [];
  const checkpoints = parsed?.inspection_checkpoints || [];
  const violations = parsed?.violations || [];
  const recommendations = parsed?.recommendations || [];

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Code Compliance Checker</h2>
          <div className="subtitle">AI analysis of applicable building codes, required permits, and inspection checkpoints</div>
        </div>
      </div>
      <div className="page-body">
        <div className="data-table-container" style={{ marginBottom: 24 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Work Type *</label>
                <select className="form-control" value={formData.workType} onChange={e => setFormData({ ...formData, workType: e.target.value })}>
                  <option>Plumbing</option>
                  <option>Electrical</option>
                  <option>HVAC</option>
                  <option>Multi-Trade</option>
                </select>
              </div>
              <div className="form-group">
                <label>Jurisdiction *</label>
                <input
                  className="form-control"
                  value={formData.jurisdiction}
                  onChange={e => setFormData({ ...formData, jurisdiction: e.target.value })}
                  placeholder="e.g., California IBC 2022, Texas, New York City"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Work Description *</label>
              <textarea
                className="form-control"
                rows={5}
                value={formData.workDescription}
                onChange={e => setFormData({ ...formData, workDescription: e.target.value })}
                placeholder="Describe the work being performed - e.g., Installing 200A electrical panel upgrade with new service entrance, sub-panel in garage, and 20 circuit breakers..."
                required
              />
            </div>
            <button type="submit" className="btn btn-ai" disabled={loading}>
              {loading ? '⏳ Checking...' : '🤖 Check Code Compliance'}
            </button>
          </form>
        </div>

        {parsed && (
          <>
            {overallStatus && (
              <div style={{
                padding: '16px 24px',
                marginBottom: 16,
                borderRadius: 8,
                background: overallStatus === 'compliant' ? '#ecfdf5' : overallStatus === 'non_compliant' ? '#fef2f2' : '#fffbeb',
                border: `2px solid ${statusColors[overallStatus] || '#6b7280'}`,
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <span style={{ fontSize: 24 }}>
                  {overallStatus === 'compliant' ? '✅' : overallStatus === 'non_compliant' ? '❌' : '⚠️'}
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: statusColors[overallStatus] }}>
                    Overall Status: {overallStatus.replace(/_/g, ' ').toUpperCase()}
                  </div>
                  {parsed.jurisdiction && <div style={{ color: '#6b7280', fontSize: 13 }}>Jurisdiction: {parsed.jurisdiction}</div>}
                </div>
              </div>
            )}

            {codes.length > 0 && (
              <div className="data-table-container" style={{ marginBottom: 24 }}>
                <div className="table-header"><h3>Applicable Code Sections</h3></div>
                {codes.map((code, ci) => (
                  <div key={ci} style={{ marginBottom: 8 }}>
                    <div style={{ padding: '8px 16px', fontWeight: 700, background: '#f3f4f6', fontSize: 13 }}>
                      {code.code_name} {code.edition}
                    </div>
                    <table className="data-table" style={{ marginBottom: 0 }}>
                      <thead>
                        <tr>
                          <th>Section</th>
                          <th>Requirement</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(code.sections || []).map((s, si) => (
                          <tr key={si}>
                            <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{s.section}</td>
                            <td style={{ fontSize: 13 }}>{s.requirement}</td>
                            <td>
                              <span style={{
                                padding: '2px 10px',
                                borderRadius: 12,
                                fontSize: 11,
                                fontWeight: 600,
                                background: statusColors[s.status] ? statusColors[s.status] + '20' : '#f3f4f6',
                                color: statusColors[s.status] || '#6b7280'
                              }}>
                                {(s.status || '').replace(/_/g, ' ')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}

            {permits.length > 0 && (
              <div className="data-table-container" style={{ marginBottom: 24 }}>
                <div className="table-header"><h3>Required Permits</h3></div>
                <table className="data-table">
                  <thead>
                    <tr><th>Permit Type</th><th>Estimated Cost</th><th>Processing Days</th><th>Notes</th></tr>
                  </thead>
                  <tbody>
                    {permits.map((p, i) => (
                      <tr key={i}>
                        <td className="title-cell">{p.permit_type}</td>
                        <td>{p.estimated_cost_range || '-'}</td>
                        <td>{p.processing_days} days</td>
                        <td style={{ fontSize: 13, color: '#6b7280' }}>{p.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {checkpoints.length > 0 && (
              <div className="data-table-container" style={{ marginBottom: 24 }}>
                <div className="table-header"><h3>Inspection Checkpoints</h3></div>
                <table className="data-table">
                  <thead>
                    <tr><th>Checkpoint</th><th>Timing</th><th>Inspector Type</th><th>Notes</th></tr>
                  </thead>
                  <tbody>
                    {checkpoints.map((c, i) => (
                      <tr key={i}>
                        <td className="title-cell">{c.checkpoint}</td>
                        <td>{c.timing}</td>
                        <td>{c.inspector_type}</td>
                        <td style={{ fontSize: 13, color: '#6b7280' }}>{c.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {violations.length > 0 && (
              <div className="data-table-container" style={{ marginBottom: 24, border: '1px solid #fca5a5' }}>
                <div className="table-header" style={{ background: '#fef2f2' }}>
                  <h3 style={{ color: '#dc2626' }}>❌ Violations ({violations.length})</h3>
                </div>
                <ul style={{ padding: '12px 24px', margin: 0 }}>
                  {violations.map((v, i) => <li key={i} style={{ color: '#dc2626', marginBottom: 4 }}>{v}</li>)}
                </ul>
              </div>
            )}

            {recommendations.length > 0 && (
              <div className="data-table-container" style={{ marginBottom: 24 }}>
                <div className="table-header"><h3>Recommendations</h3></div>
                <ul style={{ padding: '12px 24px', margin: 0 }}>
                  {recommendations.map((r, i) => <li key={i} style={{ marginBottom: 4, lineHeight: 1.5 }}>{r}</li>)}
                </ul>
              </div>
            )}
          </>
        )}

        <AIOutput content={result} loading={loading} title="AI Compliance Analysis" />
      </div>
    </>
  );
}

export default CodeComplianceChecker;
