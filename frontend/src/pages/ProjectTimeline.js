import React, { useState, useContext } from 'react';
import api from '../services/api';
import AIOutput from '../components/AIOutput';
import { ToastContext } from '../App';

const emptyForm = {
  projectType: 'Plumbing',
  projectScope: '',
  startDate: '',
  teamSize: ''
};

function ProjectTimeline() {
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [parsed, setParsed] = useState(null);
  const addToast = useContext(ToastContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.projectScope || !formData.projectType) {
      addToast('Please fill in required fields', 'error');
      return;
    }
    setLoading(true);
    setResult(null);
    setParsed(null);
    try {
      const { data } = await api.post('/ai/project-timeline', formData);
      setResult(data.timeline);
      setParsed(data.parsed);
      addToast('Project timeline generated!');
    } catch (err) {
      addToast(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to generate timeline', 'error');
    }
    setLoading(false);
  };

  const phases = parsed?.phases || [];
  const permits = parsed?.permit_requirements || [];

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Project Timeline Generator</h2>
          <div className="subtitle">AI-generated phased timelines with milestones, labor hours, and permit requirements</div>
        </div>
      </div>
      <div className="page-body">
        <div className="data-table-container" style={{ marginBottom: 24 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Project Type *</label>
                <select className="form-control" value={formData.projectType} onChange={e => setFormData({ ...formData, projectType: e.target.value })}>
                  <option>Plumbing</option>
                  <option>Electrical</option>
                  <option>HVAC</option>
                  <option>Multi-Trade</option>
                </select>
              </div>
              <div className="form-group">
                <label>Start Date</label>
                <input className="form-control" type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Team Size (technicians)</label>
                <input className="form-control" type="number" min="1" value={formData.teamSize} onChange={e => setFormData({ ...formData, teamSize: e.target.value })} placeholder="e.g., 3" />
              </div>
            </div>
            <div className="form-group">
              <label>Project Scope *</label>
              <textarea
                className="form-control"
                rows={5}
                value={formData.projectScope}
                onChange={e => setFormData({ ...formData, projectScope: e.target.value })}
                placeholder="Describe the full project scope - e.g., Complete HVAC system replacement for 3000 sq ft commercial building including ductwork removal, new unit installation, controls, and commissioning..."
                required
              />
            </div>
            <button type="submit" className="btn btn-ai" disabled={loading}>
              {loading ? '⏳ Generating...' : '🤖 Generate Project Timeline'}
            </button>
          </form>
        </div>

        {parsed && (
          <>
            {parsed.total_duration_days && (
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div className="data-table-container" style={{ flex: 1, padding: 16 }}>
                  <div style={{ color: '#6b7280', fontSize: 12, textTransform: 'uppercase', marginBottom: 4 }}>Total Duration</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#1d4ed8' }}>{parsed.total_duration_days} days</div>
                </div>
                <div className="data-table-container" style={{ flex: 1, padding: 16 }}>
                  <div style={{ color: '#6b7280', fontSize: 12, textTransform: 'uppercase', marginBottom: 4 }}>Total Labor Hours</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#059669' }}>{parsed.total_labor_hours}h</div>
                </div>
                {parsed.critical_path && (
                  <div className="data-table-container" style={{ flex: 2, padding: 16 }}>
                    <div style={{ color: '#6b7280', fontSize: 12, textTransform: 'uppercase', marginBottom: 4 }}>Critical Path</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{parsed.critical_path}</div>
                  </div>
                )}
              </div>
            )}

            {phases.length > 0 && (
              <div className="data-table-container" style={{ marginBottom: 24 }}>
                <div className="table-header"><h3>Project Phases</h3></div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Phase</th>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Duration (days)</th>
                      <th>Labor Hours</th>
                      <th>Milestones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {phases.map((phase, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 700, color: '#1d4ed8' }}>{phase.phase_number || idx + 1}</td>
                        <td className="title-cell">{phase.name}</td>
                        <td style={{ fontSize: 13, color: '#6b7280', maxWidth: 250 }}>{phase.description}</td>
                        <td style={{ fontWeight: 600 }}>{phase.duration_days}d</td>
                        <td>{phase.labor_hours}h</td>
                        <td style={{ fontSize: 12 }}>
                          {(phase.milestones || []).map((m, i) => (
                            <div key={i} style={{ marginBottom: 2 }}>
                              Day {m.day}: {m.name}
                            </div>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {permits.length > 0 && (
              <div className="data-table-container" style={{ marginBottom: 24 }}>
                <div className="table-header"><h3>Permit Requirements</h3></div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Permit Type</th>
                      <th>Processing Time</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permits.map((permit, idx) => (
                      <tr key={idx}>
                        <td className="title-cell">{permit.permit_type}</td>
                        <td>{permit.estimated_days} days</td>
                        <td style={{ fontSize: 13, color: '#6b7280' }}>{permit.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        <AIOutput content={result} loading={loading} title="AI Timeline Analysis" />
      </div>
    </>
  );
}

export default ProjectTimeline;
