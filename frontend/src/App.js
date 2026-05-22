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
import AIHistory from './pages/AIHistory';
import MaterialEstimate from './pages/MaterialEstimate';
import ProjectTimeline from './pages/ProjectTimeline';
import CodeComplianceChecker from './pages/CodeComplianceChecker';
import QuoteEstimateAI from './pages/QuoteEstimateAI';
import ScheduleOptimize from './pages/ScheduleOptimize';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';

// // === Batch 06 Gaps & Frontend Mounts ===
import CFAiJobEstimatorPage from './pages/CFAiJobEstimatorPage';
import CFCodeComplianceAutomationPage from './pages/CFCodeComplianceAutomationPage';
import CFRouteOptimizationPage from './pages/CFRouteOptimizationPage';
import CFMaterialWastePredictionPage from './pages/CFMaterialWastePredictionPage';
import CFTechnicianProductivityTrackingPage from './pages/CFTechnicianProductivityTrackingPage';
import GapAihistoryJsStubNeedsRealImplementationPage from './pages/GapAihistoryJsStubNeedsRealImplementationPage';
import GapJobquotesWithoutQuotePage from './pages/GapJobquotesWithoutQuotePage';
import GapSchedulesWithoutSchedulePage from './pages/GapSchedulesWithoutSchedulePage';
import GapCodeComplianceWithoutCodePage from './pages/GapCodeComplianceWithoutCodePage';
import GapNoRealIntegrationWithPermitCodeDatabasesOnlPage from './pages/GapNoRealIntegrationWithPermitCodeDatabasesOnlPage';
import GapNoCustomerFinancingOptionsCreditPaymentPlansPage from './pages/GapNoCustomerFinancingOptionsCreditPaymentPlansPage';
import GapNoSupplyChainIntegrationMaterialOrderingAutoPage from './pages/GapNoSupplyChainIntegrationMaterialOrderingAutoPage';
import GapLimitedPhotoDocumentationBeforeAfterPage from './pages/GapLimitedPhotoDocumentationBeforeAfterPage';
import GapNoAccountingSystemIntegrationQuickbooksFreshbPage from './pages/GapNoAccountingSystemIntegrationQuickbooksFreshbPage';
import GapNoNotificationsModuleGrep0Page from './pages/GapNoNotificationsModuleGrep0Page';
import GapNoAuditLoggingGrep0Page from './pages/GapNoAuditLoggingGrep0Page';
import GapNoWebhooksPage from './pages/GapNoWebhooksPage';
import GapNoMobileAppForTechsPage from './pages/GapNoMobileAppForTechsPage';
import CustomViewsPage from './pages/CustomViewsPage';
import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

import TimelineView from './pages/TimelineView';

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
        <Route path="/insights/timeline" element={<TimelineView />} />
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

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
              <Route path="/ai-history" element={<AIHistory />} />
              <Route path="/ai-material-estimate" element={<MaterialEstimate />} />
              <Route path="/ai-project-timeline" element={<ProjectTimeline />} />
              <Route path="/ai-code-compliance" element={<CodeComplianceChecker />} />
              <Route path="/ai-quote-estimate" element={<QuoteEstimateAI />} />
              <Route path="/ai-schedule-optimize" element={<ScheduleOptimize />} />
              <Route path="*" element={<Navigate to="/" />} />
            
          {/* // === Batch 06 Gaps & Frontend Mounts === */}
          <Route path="/cf-ai-job-estimator" element={<CFAiJobEstimatorPage />} />
          <Route path="/cf-code-compliance-automation" element={<CFCodeComplianceAutomationPage />} />
          <Route path="/cf-route-optimization" element={<CFRouteOptimizationPage />} />
          <Route path="/cf-material-waste-prediction" element={<CFMaterialWastePredictionPage />} />
          <Route path="/cf-technician-productivity-tracking" element={<CFTechnicianProductivityTrackingPage />} />
          <Route path="/gap-aihistory-js-stub-needs-real-implementation" element={<GapAihistoryJsStubNeedsRealImplementationPage />} />
          <Route path="/gap-jobquotes-without-quote" element={<GapJobquotesWithoutQuotePage />} />
          <Route path="/gap-schedules-without-schedule" element={<GapSchedulesWithoutSchedulePage />} />
          <Route path="/gap-code-compliance-without-code" element={<GapCodeComplianceWithoutCodePage />} />
          <Route path="/gap-no-real-integration-with-permit-code-databases-onl" element={<GapNoRealIntegrationWithPermitCodeDatabasesOnlPage />} />
          <Route path="/gap-no-customer-financing-options-credit-payment-plans" element={<GapNoCustomerFinancingOptionsCreditPaymentPlansPage />} />
          <Route path="/gap-no-supply-chain-integration-material-ordering-auto" element={<GapNoSupplyChainIntegrationMaterialOrderingAutoPage />} />
          <Route path="/gap-limited-photo-documentation-before-after" element={<GapLimitedPhotoDocumentationBeforeAfterPage />} />
          <Route path="/gap-no-accounting-system-integration-quickbooks-freshb" element={<GapNoAccountingSystemIntegrationQuickbooksFreshbPage />} />
          <Route path="/gap-no-notifications-module-grep-0" element={<GapNoNotificationsModuleGrep0Page />} />
          <Route path="/gap-no-audit-logging-grep-0" element={<GapNoAuditLoggingGrep0Page />} />
          <Route path="/gap-no-webhooks" element={<GapNoWebhooksPage />} />
          <Route path="/gap-no-mobile-app-for-techs" element={<GapNoMobileAppForTechsPage />} />
          <Route path="/custom-views" element={<CustomViewsPage />} />
        </Routes>
          </div>
        </div>
        <Toast toasts={toasts} />
      </Router>
    </ToastContext.Provider>
  );
}

export default App;
