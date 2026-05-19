import React, { useState, useContext } from 'react';
import api from '../services/api';
import AIOutput from '../components/AIOutput';
import { ToastContext } from '../App';

function safeParseJSON(text, fallback) {
  if (!text) return fallback;
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function ScheduleOptimize() {
  const [jobsText, setJobsText] = useState(
    '[\n  {"id":"J1","address":"123 Oak St","duration_hr":3,"priority":"high","skills":["plumbing"]}\n]'
  );
  const [techsText, setTechsText] = useState(
    '[\n  {"id":"T1","name":"Alex","skills":["plumbing","HVAC"],"start":"08:00","end":"17:00","home":"100 Main St"}\n]'
  );
  const [constraints, setConstraints] = useState('');
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [parsed, setParsed] = useState(null);
  const addToast = useContext(ToastContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const jobs = safeParseJSON(jobsText, null);
    const technicians = safeParseJSON(techsText, null);
    if (!Array.isArray(jobs) || !Array.isArray(technicians)) {
      addToast('Jobs and Technicians must be valid JSON arrays', 'error');
      return;
    }
    if (jobs.length === 0 || technicians.length === 0) {
      addToast('Provide at least one job and one technician', 'error');
      return;
    }
    setLoading(true);
    setContent('');
    setParsed(null);
    try {
      const payload = { jobs, technicians };
      if (constraints.trim()) payload.constraints = constraints.trim();
      const { data } = await api.post('/ai/schedule-optimize', payload);
      setContent(data.estimation || data.content || '');
      setParsed(data.parsed || null);
      addToast('Schedule optimized!');
    } catch (err) {
      addToast(
        err.response?.data?.error ||
          err.response?.data?.errors?.[0]?.msg ||
          'Failed to optimize schedule',
        'error'
      );
    }
    setLoading(false);
  };

  const assignments = parsed?.assignments || [];
  const unassigned = parsed?.unassigned || parsed?.unassigned_jobs || [];

  return (
    <>
      <div className="page-header">
        <div>
          <h2>AI Schedule Optimizer</h2>
          <div className="subtitle">Assign jobs to technicians; minimize drive + idle time</div>
        </div>
      </div>
      <div className="page-body">
        <div className="data-table-container" style={{ marginBottom: 24 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Jobs (JSON array) *</label>
                <textarea
                  className="form-control"
                  rows={6}
                  value={jobsText}
                  onChange={(e) => setJobsText(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Technicians (JSON array) *</label>
                <textarea
                  className="form-control"
                  rows={6}
                  value={techsText}
                  onChange={(e) => setTechsText(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Constraints (optional)</label>
              <textarea
                className="form-control"
                rows={2}
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                placeholder="e.g., No overtime; lunch break 12:00-12:30; service area within 20 mi"
              />
            </div>
            <button type="submit" className="btn btn-ai" disabled={loading}>
              {loading ? '⏳ Optimizing...' : '🤖 Optimize Schedule'}
            </button>
          </form>
        </div>

        {parsed && assignments.length > 0 && (
          <div className="data-table-container" style={{ marginBottom: 24 }}>
            <div className="table-header">
              <h3>Assignments</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Technician</th>
                  <th>Job</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Drive (min)</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a, idx) => (
                  <tr key={idx}>
                    <td className="title-cell">{a.technician_id || a.tech || a.technician}</td>
                    <td>{a.job_id || a.job}</td>
                    <td>{a.start || a.window_start || '-'}</td>
                    <td>{a.end || a.window_end || '-'}</td>
                    <td>{a.drive_minutes ?? a.drive_min ?? '-'}</td>
                    <td style={{ fontSize: 12, color: '#6b7280' }}>{a.notes || a.reason || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {parsed && unassigned.length > 0 && (
          <div className="data-table-container" style={{ marginBottom: 24 }}>
            <div className="table-header">
              <h3>Unassigned Jobs</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {unassigned.map((u, idx) => (
                  <tr key={idx}>
                    <td className="title-cell">{u.job_id || u.id || u}</td>
                    <td style={{ color: '#b45309' }}>{u.reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AIOutput content={content} loading={loading} title="AI Scheduling Plan" />
      </div>
    </>
  );
}

export default ScheduleOptimize;
