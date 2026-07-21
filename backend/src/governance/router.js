const express=require('express');const sequelize=require('../config/database');const auth=require('../middleware/auth');const {createWorkflow}=require('./workflowCore');const {createGovernedRouter}=require('./routerFactory');
const rows=async(executor,sql,params)=>{const [result]=await executor.query(sql,{bind:params});return Array.isArray(result)?result:[];};
const db={query:(s,p)=>rows(sequelize,s,p),transaction:work=>sequelize.transaction(t=>work((s,p)=>rows(t,s,p)))};
module.exports=createGovernedRouter({express,workflow:createWorkflow(require('./config')),auth,db});
