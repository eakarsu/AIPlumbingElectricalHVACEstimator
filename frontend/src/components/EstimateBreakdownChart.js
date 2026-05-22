import React, { useEffect, useState } from 'react';
import api from '../services/api';

// VIZ 1: Estimate breakdown — dual bar chart (by status + by job type)
function EstimateBreakdownChart() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api.get('/custom-views/estimate-breakdown')
      .then(r => { if (alive) { setData(r.data); setLoading(false); } })
      .catch(e => { if (alive) { setErr(e.response?.data?.error || e.message); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  if (loading) return <div style={{ padding: 16 }}>Loading estimate breakdown…</div>;
  if (err) return <div style={{ padding: 16, color: '#dc2626' }}>Error: {err}</div>;
  if (!data) return null;

  const renderBars = (series, color) => {
    const max = Math.max(1, ...series.map(s => s.value));
    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: 160, padding: '8px 4px' }}>
        {series.map((s, i) => {
          const h = Math.round((s.value / max) * 140);
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontSize: 11, color: '#374151' }}>${s.value.toLocaleString()}</div>
              <div style={{ width: '100%', background: color, height: h, borderRadius: 6, transition: 'height .3s' }} />
              <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'capitalize' }}>{s.label}</div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h3 style={{ margin: 0, marginBottom: 12 }}>Estimate Breakdown</h3>
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 13, color: '#374151' }}>
        <div><strong>Total Estimated:</strong> ${data.totalEstimated.toLocaleString()}</div>
        <div><strong>Labor Hours:</strong> {data.totalLaborHours}</div>
        <div><strong>Quotes:</strong> {data.quoteCount}</div>
      </div>
      <div style={{ marginBottom: 8, fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4 }}>By Status</div>
      {renderBars(data.statusSeries, '#1a56db')}
      <div style={{ marginTop: 16, marginBottom: 8, fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4 }}>By Job Type</div>
      {renderBars(data.jobTypeSeries, '#059669')}
    </div>
  );
}

export default EstimateBreakdownChart;
