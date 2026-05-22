import React, { useEffect, useState } from 'react';
import api from '../services/api';

// VIZ 2: Materials cost heatmap (category x job type)
function MaterialsCostHeatmap() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api.get('/custom-views/materials-heatmap')
      .then(r => { if (alive) { setData(r.data); setLoading(false); } })
      .catch(e => { if (alive) { setErr(e.response?.data?.error || e.message); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  if (loading) return <div style={{ padding: 16 }}>Loading materials heatmap…</div>;
  if (err) return <div style={{ padding: 16, color: '#dc2626' }}>Error: {err}</div>;
  if (!data) return null;

  const colorFor = (v) => {
    if (!data.maxValue) return '#f3f4f6';
    const ratio = v / data.maxValue;
    // blue → red gradient
    const r = Math.round(40 + ratio * 200);
    const g = Math.round(60 + (1 - ratio) * 80);
    const b = Math.round(200 - ratio * 160);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div style={{ background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h3 style={{ margin: 0, marginBottom: 12 }}>Materials Cost Heatmap (Category × Job Type)</h3>
      <div style={{ marginBottom: 12, fontSize: 13, color: '#374151' }}>
        Materials tracked: <strong>{data.materialCount}</strong> · Max cell: <strong>${data.maxValue.toLocaleString()}</strong>
      </div>
      <table style={{ borderCollapse: 'separate', borderSpacing: 4, width: '100%' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: 12, color: '#6b7280' }}>Category</th>
            {data.jobTypes.map(jt => (
              <th key={jt} style={{ padding: '6px 10px', fontSize: 12, color: '#6b7280', textTransform: 'capitalize' }}>{jt}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.matrix.map(row => (
            <tr key={row.category}>
              <td style={{ padding: '6px 10px', fontSize: 13, fontWeight: 600, color: '#111827' }}>{row.category}</td>
              {row.values.map((v, i) => (
                <td key={i} style={{
                  background: colorFor(v),
                  color: '#fff',
                  textAlign: 'center',
                  padding: '12px 8px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  minWidth: 80,
                }}>${v.toLocaleString()}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MaterialsCostHeatmap;
