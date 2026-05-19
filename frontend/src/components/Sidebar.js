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
  // === Batch 06 Gaps & Frontend Mounts ===
  { path: '/cf-ai-job-estimator', label: 'AI job estimator', icon: '✨' },
  { path: '/cf-code-compliance-automation', label: 'Code compliance automation', icon: '✨' },
  { path: '/cf-route-optimization', label: 'Route optimization', icon: '✨' },
  { path: '/cf-material-waste-prediction', label: 'Material waste prediction', icon: '✨' },
  { path: '/cf-technician-productivity-tracking', label: 'Technician productivity tracking', icon: '✨' },
  { path: '/gap-aihistory-js-stub-needs-real-implementation', label: '`aiHistory.js` stub needs real implementation', icon: '✨' },
  { path: '/gap-jobquotes-without-quote', label: 'JobQuotes without `/quote', icon: '✨' },
  { path: '/gap-schedules-without-schedule', label: 'Schedules without `/schedule', icon: '✨' },
  { path: '/gap-code-compliance-without-code', label: 'Code compliance without `/code', icon: '✨' },
  { path: '/gap-no-real-integration-with-permit-code-databases-onl', label: 'No real integration with permit/code databases (only generic integrations module)', icon: '✨' },
  { path: '/gap-no-customer-financing-options-credit-payment-plans', label: 'No customer financing options (credit, payment plans)', icon: '✨' },
  { path: '/gap-no-supply-chain-integration-material-ordering-auto', label: 'No supply chain integration (material ordering automation)', icon: '✨' },
  { path: '/gap-limited-photo-documentation-before-after', label: 'Limited photo documentation (before/after)', icon: '✨' },
  { path: '/gap-no-accounting-system-integration-quickbooks-freshb', label: 'No accounting system integration (QuickBooks, FreshBooks)', icon: '✨' },
  { path: '/gap-no-notifications-module-grep-0', label: 'No notifications module (grep 0)', icon: '✨' },
  { path: '/gap-no-audit-logging-grep-0', label: 'No audit logging (grep 0)', icon: '✨' },
  { path: '/gap-no-webhooks', label: 'No webhooks', icon: '✨' },
  { path: '/gap-no-mobile-app-for-techs', label: 'No mobile app for techs', icon: '✨' }
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
    },
    {
      title: 'Estimator Views',
      items: [
        { path: '/custom-views', label: 'Estimator Views', icon: '📐' },
      ]
    },
    {
      title: 'AI Tools',
      items: [
        { path: '/ai-material-estimate', label: 'Material Estimator', icon: '🔩' },
        { path: '/ai-project-timeline', label: 'Project Timeline', icon: '📆' },
        { path: '/ai-code-compliance', label: 'Code Compliance', icon: '⚖️' },
        { path: '/ai-quote-estimate', label: 'Quote Estimator', icon: '💵' },
        { path: '/ai-schedule-optimize', label: 'Schedule Optimizer', icon: '🗓️' },
        { path: '/ai-history', label: 'AI History', icon: '🤖' },
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
