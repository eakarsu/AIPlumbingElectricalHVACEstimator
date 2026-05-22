import React, { useEffect, useState } from 'react';
import api from '../services/api';

// NON-VIZ 2: Estimating rules editor — CRUD for labor rates and markups
function EstimatingRulesEditor() {
  const [rules, setRules] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', category: 'Plumbing', laborRate: '', markup: '', notes: '' });
  const [editingId, setEditingId] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/custom-views/estimating-rules')
      .then(r => { setRules(r.data.rules || []); setLoading(false); })
      .catch(e => { setErr(e.response?.data?.error || e.message); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const reset = () => { setForm({ name: '', category: 'Plumbing', laborRate: '', markup: '', notes: '' }); setEditingId(null); };

  const submit = async () => {
    setErr('');
    try {
      if (editingId) {
        await api.put(`/custom-views/estimating-rules/${editingId}`, {
          ...form, laborRate: Number(form.laborRate) || 0, markup: Number(form.markup) || 0
        });
      } else {
        await api.post('/custom-views/estimating-rules', {
          ...form, laborRate: Number(form.laborRate) || 0, markup: Number(form.markup) || 0
        });
      }
      reset(); load();
    } catch (e) { setErr(e.response?.data?.error || e.message); }
  };

  const edit = (r) => {
    setEditingId(r.id);
    setForm({ name: r.name, category: r.category, laborRate: r.laborRate, markup: r.markup, notes: r.notes || '' });
  };

  const del = async (id) => {
    if (!window.confirm('Delete this rule?')) return;
    await api.delete(`/custom-views/estimating-rules/${id}`);
    load();
  };

  return (
    <div style={{ background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h3 style={{ margin: 0, marginBottom: 12 }}>Estimating Rules Editor (Labor Rates & Markups)</h3>
      {err && <div style={{ color: '#dc2626', marginBottom: 8 }}>Error: {err}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) auto', gap: 8, marginBottom: 12, alignItems: 'end' }}>
        <div>
          <label style={{ fontSize: 11, color: '#6b7280' }}>Name</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ width: '100%', padding: 6, border: '1px solid #d1d5db', borderRadius: 4 }} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#6b7280' }}>Category</label>
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ width: '100%', padding: 6, border: '1px solid #d1d5db', borderRadius: 4 }}>
            <option>Plumbing</option><option>Electrical</option><option>HVAC</option><option>General</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#6b7280' }}>Labor $/hr</label>
          <input type="number" value={form.laborRate} onChange={e => setForm({ ...form, laborRate: e.target.value })} style={{ width: '100%', padding: 6, border: '1px solid #d1d5db', borderRadius: 4 }} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#6b7280' }}>Markup %</label>
          <input type="number" value={form.markup} onChange={e => setForm({ ...form, markup: e.target.value })} style={{ width: '100%', padding: 6, border: '1px solid #d1d5db', borderRadius: 4 }} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#6b7280' }}>Notes</label>
          <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ width: '100%', padding: 6, border: '1px solid #d1d5db', borderRadius: 4 }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={submit} style={{ padding: '8px 12px', background: editingId ? '#d97706' : '#1a56db', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            {editingId ? 'Update' : 'Add'}
          </button>
          {editingId && <button onClick={reset} style={{ padding: '8px 12px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>}
        </div>
      </div>
      {loading ? <div>Loading…</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ textAlign: 'left', padding: 8 }}>Name</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Category</th>
              <th style={{ textAlign: 'right', padding: 8 }}>Labor $/hr</th>
              <th style={{ textAlign: 'right', padding: 8 }}>Markup %</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Notes</th>
              <th style={{ padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: 8, fontWeight: 600 }}>{r.name}</td>
                <td style={{ padding: 8 }}>{r.category}</td>
                <td style={{ padding: 8, textAlign: 'right' }}>${r.laborRate}</td>
                <td style={{ padding: 8, textAlign: 'right' }}>{r.markup}%</td>
                <td style={{ padding: 8, color: '#6b7280' }}>{r.notes}</td>
                <td style={{ padding: 8, display: 'flex', gap: 6 }}>
                  <button onClick={() => edit(r)} style={{ padding: '4px 8px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => del(r.id)} style={{ padding: '4px 8px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default EstimatingRulesEditor;
