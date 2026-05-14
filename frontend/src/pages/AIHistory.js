import React, { useState, useEffect } from 'react';
import api from '../services/api';

function AIHistory() {
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/ai/history?page=${p}&limit=20`);
      // Handle both new { data, pagination } format and legacy { results, totalPages }
      if (data.data) {
        setResults(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      } else {
        setResults(data.results || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
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
                    <th>Result Preview</th>
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
                      <td style={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: '#6b7280' }}>
                        {typeof r.result === 'object' ? JSON.stringify(r.result).substring(0, 120) + '...' : String(r.result || '').substring(0, 120)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

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
