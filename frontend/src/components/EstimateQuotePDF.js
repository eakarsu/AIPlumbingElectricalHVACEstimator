import React, { useEffect, useState } from 'react';
import api from '../services/api';

// NON-VIZ 1: Estimate quote PDF — fetches a printable estimate doc
function EstimateQuotePDF() {
  const [id, setId] = useState('1');
  const [doc, setDoc] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const load = (qid) => {
    setLoading(true); setErr('');
    api.get(`/custom-views/quote-pdf/${qid}`)
      .then(r => { setDoc(r.data); setLoading(false); })
      .catch(e => { setErr(e.response?.data?.error || e.message); setLoading(false); });
  };

  useEffect(() => { load(id); }, []); // eslint-disable-line

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  return (
    <div style={{ background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h3 style={{ margin: 0, marginBottom: 12 }}>Estimate Quote PDF</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          value={id}
          onChange={e => setId(e.target.value)}
          placeholder="Quote ID"
          style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, width: 120 }}
        />
        <button onClick={() => load(id)} style={{ padding: '8px 14px', background: '#1a56db', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Load
        </button>
        <button onClick={handlePrint} style={{ padding: '8px 14px', background: '#059669', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Print
        </button>
      </div>
      {loading && <div>Loading…</div>}
      {err && <div style={{ color: '#dc2626' }}>Error: {err}</div>}
      {doc && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, background: '#fafafa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #1a56db', paddingBottom: 10, marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{doc.company}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Estimate · {new Date(doc.generatedAt).toLocaleString()}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Quote #</div>
              <div style={{ fontWeight: 700 }}>{doc.quote.id}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#6b7280' }}>Customer</div>
              <div style={{ fontWeight: 600 }}>{doc.quote.customer.name}</div>
              <div style={{ fontSize: 12, color: '#374151' }}>{doc.quote.customer.email}</div>
              <div style={{ fontSize: 12, color: '#374151' }}>{doc.quote.customer.phone}</div>
              <div style={{ fontSize: 12, color: '#374151' }}>{doc.quote.customer.address}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#6b7280' }}>Scope</div>
              <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{doc.quote.scope.jobType}</div>
              <div style={{ fontSize: 12, color: '#374151' }}>{doc.quote.scope.description}</div>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#1a56db', color: '#fff' }}>
                <th style={{ textAlign: 'left', padding: 8 }}>Item</th>
                <th style={{ textAlign: 'right', padding: 8 }}>Qty</th>
                <th style={{ textAlign: 'right', padding: 8 }}>Rate</th>
                <th style={{ textAlign: 'right', padding: 8 }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {doc.quote.lineItems.map((li, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: 8 }}>{li.label}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{li.qty}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>${Number(li.rate).toLocaleString()}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>${Number(li.subtotal).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f3f4f6', fontWeight: 700 }}>
                <td colSpan={3} style={{ padding: 10, textAlign: 'right' }}>Grand Total</td>
                <td style={{ padding: 10, textAlign: 'right' }}>${Number(doc.quote.totals.grandTotal).toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

export default EstimateQuotePDF;
