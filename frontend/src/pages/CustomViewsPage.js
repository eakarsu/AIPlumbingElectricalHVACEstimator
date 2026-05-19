import React from 'react';
import EstimateBreakdownChart from '../components/EstimateBreakdownChart';
import MaterialsCostHeatmap from '../components/MaterialsCostHeatmap';
import EstimateQuotePDF from '../components/EstimateQuotePDF';
import EstimatingRulesEditor from '../components/EstimatingRulesEditor';

function CustomViewsPage() {
  return (
    <>
      <div className="page-header">
        <div>
          <h2>Estimator Views</h2>
          <div className="subtitle">Custom estimation breakdowns, heatmaps, quote docs, and rule overrides.</div>
        </div>
      </div>
      <div className="page-body" style={{ display: 'grid', gap: 20 }}>
        <EstimateBreakdownChart />
        <MaterialsCostHeatmap />
        <EstimateQuotePDF />
        <EstimatingRulesEditor />
      </div>
    </>
  );
}

export default CustomViewsPage;
