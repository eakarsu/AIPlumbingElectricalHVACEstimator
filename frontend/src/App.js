import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import JobQuotes from './pages/JobQuotes';
import Materials from './pages/Materials';
import CodeCompliance from './pages/CodeCompliance';
import Schedules from './pages/Schedules';
import Invoices from './pages/Invoices';
import Customers from './pages/Customers';
import Technicians from './pages/Technicians';
import Projects from './pages/Projects';
import Expenses from './pages/Expenses';
import Warranties from './pages/Warranties';
import Equipment from './pages/Equipment';
import ServiceContracts from './pages/ServiceContracts';
import Permits from './pages/Permits';
import Suppliers from './pages/Suppliers';
import Reports from './pages/Reports';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';

export const ToastContext = React.createContext();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <ToastContext.Provider value={addToast}>
        <Router>
          <Login onLogin={handleLogin} />
          <Toast toasts={toasts} />
        </Router>
      </ToastContext.Provider>
    );
  }

  return (
    <ToastContext.Provider value={addToast}>
      <Router>
        <div className="app-layout">
          <Sidebar user={user} onLogout={handleLogout} />
          <div className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/job-quotes" element={<JobQuotes />} />
              <Route path="/materials" element={<Materials />} />
              <Route path="/code-compliance" element={<CodeCompliance />} />
              <Route path="/schedules" element={<Schedules />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/technicians" element={<Technicians />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/warranties" element={<Warranties />} />
              <Route path="/equipment" element={<Equipment />} />
              <Route path="/service-contracts" element={<ServiceContracts />} />
              <Route path="/permits" element={<Permits />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
        <Toast toasts={toasts} />
      </Router>
    </ToastContext.Provider>
  );
}

export default App;
