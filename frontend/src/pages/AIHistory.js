import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { listPayload } from '../services/listPayload';
import AIReport from '../components/AIReport';

function AIHistory() {
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchHistory = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/ai/history?page=${p}&limit=20`);
      // Handle both new { data, pagination } format and legacy { results, totalPages }
      if (Array.isArray(data?.data)) {
        setResults(listPayload(data));
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      } else {
        setResults(listPayload(data, 'results'));
        setTotalPages(data?.totalPages || 1);
        setTotal(data?.total || 0);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchHistory(page); }, [page]);

  return (
    <>
      <div className="page-header">
        <div>
          <h2>AI History</h2>
          <div className="subtitle">Past AI generations and analyses ({total} total)</div>
        </div>
      </div>
      <div className="page-body">
        <div className="data-table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Loading...</div>
          ) : results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>No AI history yet. Run an AI analysis to see results here.</div>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Endpoint</th>
                    <th>Quote ID</th>
                    <th>Report</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(r => (
                    <tr key={r.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                        {new Date(r.created_at || r.createdAt).toLocaleString()}
                      </td>
                      <td><span style={{ fontFamily: 'monospace', fontSize: 12, background: '#f3f4f6', padding: '2px 8px', borderRadius: 4 }}>{r.endpoint}</span></td>
                      <td>{r.quote_id || r.quoteId || '-'}</td>
                      <td><button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelected(r)}>View report</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {selected && <section aria-label="Saved AI report" style={{ margin: 24 }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}>Close report</button>
                <AIReport response={selected.result} title={`Saved ${selected.endpoint || 'AI'} report`} />
              </section>}

              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: '16px 0' }}>
                  <button className="btn btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    Previous
                  </button>
                  <span style={{ fontSize: 14, color: '#6b7280' }}>Page {page} of {totalPages}</span>
                  <button className="btn btn-secondary" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default AIHistory;
