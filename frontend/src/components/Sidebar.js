import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Sidebar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const sections = [
    {
      title: 'Core Operations',
      items: [
        { path: '/', label: 'Dashboard', icon: '📊' },
        { path: '/job-quotes', label: 'Job Quotes', icon: '📋' },
        { path: '/projects', label: 'Projects', icon: '🏗️' },
        { path: '/schedules', label: 'Scheduling', icon: '📅' },
        { path: '/invoices', label: 'Invoicing', icon: '💰' },
      ]
    },
    {
      title: 'Resources',
      items: [
        { path: '/customers', label: 'Customers', icon: '👥' },
        { path: '/technicians', label: 'Technicians', icon: '👷' },
        { path: '/materials', label: 'Materials & Pricing', icon: '🔧' },
        { path: '/equipment', label: 'Equipment', icon: '🛠️' },
        { path: '/suppliers', label: 'Suppliers', icon: '🏭' },
      ]
    },
    {
      title: 'Compliance & Legal',
      items: [
        { path: '/code-compliance', label: 'Code Compliance', icon: '📜' },
        { path: '/permits', label: 'Permits & Inspections', icon: '📄' },
        { path: '/warranties', label: 'Warranties', icon: '🛡️' },
        { path: '/service-contracts', label: 'Service Contracts', icon: '📝' },
      ]
    },
    {
      title: 'Financial',
      items: [
        { path: '/expenses', label: 'Expenses', icon: '💳' },
        { path: '/reports', label: 'Reports & Analytics', icon: '📈' },
      ]
    }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>⚡ ProTrades AI</h1>
        <p>Plumbing · Electrical · HVAC</p>
      </div>

      <nav className="sidebar-nav">
        {sections.map((section, si) => (
          <React.Fragment key={si}>
            <div className="nav-section-title">{section.title}</div>
            {section.items.map(item => (
              <div
                key={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </React.Fragment>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="avatar">{user?.name?.charAt(0) || 'U'}</div>
          <div className="user-details">
            <div className="name">{user?.name}</div>
            <div className="email">{user?.email}</div>
          </div>
          <button className="logout-btn" onClick={onLogout} title="Logout">⏻</button>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
