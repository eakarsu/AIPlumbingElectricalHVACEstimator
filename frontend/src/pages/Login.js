import React, { useState, useContext } from 'react';
import api from '../services/api';
import { ToastContext } from '../App';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const addToast = useContext(ToastContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister
        ? { name, email, password, company }
        : { email, password };

      const { data } = await api.post(endpoint, payload);
      addToast('Login successful! Welcome back.', 'success');
      onLogin(data.user, data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Connection failed. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail('demo@hvacpro.com');
    setPassword('password123');
    setIsRegister(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo">
          <div className="icon">⚡</div>
          <h1>ProTrades AI Estimator</h1>
          <p>Plumbing · Electrical · HVAC</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John Contractor"
                  required
                />
              </div>
              <div className="form-group">
                <label>Company</label>
                <input
                  type="text"
                  className="form-control"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="ProTrades LLC"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            onClick={() => setIsRegister(!isRegister)}
            style={{ background: 'none', border: 'none', color: '#1a56db', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            {isRegister ? 'Already have an account? Sign In' : 'Need an account? Register'}
          </button>
        </div>

        <div className="demo-credentials">
          <p>Quick Demo Access</p>
          <button type="button" className="demo-btn" onClick={fillDemo}>
            Fill Demo Credentials (demo@hvacpro.com)
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
