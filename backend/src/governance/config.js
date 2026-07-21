module.exports={
 caseType:'reconciled_trade_service_order',initialState:'intake_validated',
 states:['intake_validated','scope_priced','approval_pending','payment_pending','payment_confirmed','scheduled','assigned','in_progress','exception_hold','completed','reconciliation_pending','closed','cancelled'],
 createRoles:['estimator','service_manager'],assessmentRoles:['estimator','licensed_reviewer','finance_reviewer','dispatcher'],auditRoles:['service_manager','finance_reviewer','auditor'],connectorRoles:['integration_operator','service_manager'],
 evidenceKinds:['intake_snapshot','scope_version','site_photo_manifest','license_permit_check','code_version','inventory_reservation','price_tax_snapshot','customer_approval','payment_authorization','schedule_reservation','technician_assignment','work_log','exception_record','completion_acceptance','refund_receipt','accounting_reconciliation'],
 requiredSignals:['scopeVersion','priceVersion','inventoryVersion','quotedTotal','calculatedTotal','licenseStatus','permitStatus','inventoryStatus','taxStatus','paymentStatus','scheduleStatus','policyVersion'],
 professionalBoundary:'Estimates, code suggestions, payment, assignment, and service actions require licensed trade, customer, finance, and operations review; the application cannot authorize unsafe work.',
 connectors:[{name:'payment',purpose:'authorization capture refund and webhook receipts'},{name:'tax',purpose:'versioned tax quote receipts'},{name:'inventory_supplier',purpose:'reservation and fulfillment receipts'},{name:'scheduling_dispatch',purpose:'capacity and assignment receipts'},{name:'permit_code',purpose:'jurisdiction and code-version evidence'},{name:'accounting',purpose:'invoice refund and reconciliation receipts'},{name:'messaging',purpose:'customer and technician acknowledgements'}],
 transitions:[
  {from:'intake_validated',action:'price_scope',to:'scope_priced',roles:['estimator','licensed_reviewer'],requiresEvidence:true},
  {from:'scope_priced',action:'request_approval',to:'approval_pending',roles:['estimator'],requiresEvidence:true},
  {from:'approval_pending',action:'request_payment',to:'payment_pending',roles:['finance_reviewer'],requiresEvidence:true,dualControl:true},
  {from:'payment_pending',action:'confirm_payment',to:'payment_confirmed',roles:['integration_operator','finance_reviewer'],requiresEvidence:true},
  {from:'payment_confirmed',action:'schedule_service',to:'scheduled',roles:['dispatcher'],requiresEvidence:true,dualControl:true},
  {from:'scheduled',action:'assign_technician',to:'assigned',roles:['dispatcher','service_manager'],requiresEvidence:true,dualControl:true},
  {from:'assigned',action:'start_work',to:'in_progress',roles:['technician'],requiresEvidence:true},
  {from:'in_progress',action:'open_exception',to:'exception_hold',roles:['technician','licensed_reviewer'],requiresEvidence:true},
  {from:'exception_hold',action:'cancel_and_refund',to:'cancelled',roles:['service_manager','finance_reviewer'],requiresEvidence:true,dualControl:true},
  {from:'exception_hold',action:'resume_work',to:'in_progress',roles:['licensed_reviewer','service_manager'],requiresEvidence:true,dualControl:true},
  {from:'in_progress',action:'record_completion',to:'completed',roles:['technician','licensed_reviewer'],requiresEvidence:true},
  {from:'completed',action:'start_reconciliation',to:'reconciliation_pending',roles:['finance_reviewer'],requiresEvidence:true,dualControl:true},
  {from:'reconciliation_pending',action:'close_order',to:'closed',roles:['service_manager','finance_reviewer'],requiresEvidence:true,dualControl:true}
 ],
 acceptedFixture:{scopeVersion:'s1',priceVersion:'p1',inventoryVersion:'i1',quotedTotal:1250,calculatedTotal:1250,licenseStatus:'verified',permitStatus:'verified_or_not_required',inventoryStatus:'reserved',taxStatus:'verified',paymentStatus:'authorized',scheduleStatus:'available',policyVersion:'v1'},
 readyDisposition:'human_order_approval_required',holdDisposition:'pricing_fulfillment_or_compliance_hold',decisionField:'dispatchCommand',
 assess:x=>{const quoted=Number(x.quotedTotal),calculated=Number(x.calculatedTotal);const totals=Number.isFinite(quoted)&&Number.isFinite(calculated)&&quoted>=0&&calculated>=0&&Math.abs(quoted-calculated)<=0.01;const ready=totals&&x.licenseStatus==='verified'&&x.permitStatus==='verified_or_not_required'&&x.inventoryStatus==='reserved'&&x.taxStatus==='verified'&&x.paymentStatus==='authorized'&&x.scheduleStatus==='available';return{disposition:ready?'human_order_approval_required':'pricing_fulfillment_or_compliance_hold',dispatchCommand:null,chargeCommand:null,metrics:{quotedTotal:quoted,calculatedTotal:calculated},versions:{scope:x.scopeVersion,price:x.priceVersion,inventory:x.inventoryVersion}};}
};
