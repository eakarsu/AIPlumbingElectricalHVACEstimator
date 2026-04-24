const https = require('https');
const http = require('http');
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

async function callOpenRouter(messages) {
  const body = JSON.stringify({
    model: OPENROUTER_MODEL,
    messages: messages,
    max_tokens: 2000,
    temperature: 0.7
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'HVAC Estimator'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(new Error(parsed.error.message || 'OpenRouter API error'));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(new Error('Failed to parse OpenRouter response'));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function analyzeJobQuote(description, jobType) {
  const messages = [
    {
      role: 'system',
      content: 'You are an expert plumbing, electrical, and HVAC estimator. Provide detailed, professional cost estimates and job analysis. Always respond with structured analysis including: estimated cost range, labor hours, required materials, complexity level, and recommendations.'
    },
    {
      role: 'user',
      content: `Analyze this ${jobType} job and provide a detailed estimate:\n\nJob Description: ${description}\n\nPlease provide:\n1. **Cost Estimate** (low and high range)\n2. **Labor Hours** needed\n3. **Required Materials** with approximate costs\n4. **Complexity Level** (Low/Medium/High)\n5. **Key Considerations** and potential issues\n6. **Recommendations** for the contractor`
    }
  ];
  return callOpenRouter(messages);
}

async function estimateMaterials(jobDescription, jobType) {
  const messages = [
    {
      role: 'system',
      content: 'You are an expert material estimator for plumbing, electrical, and HVAC projects. Provide detailed material lists with quantities and current market pricing.'
    },
    {
      role: 'user',
      content: `Generate a detailed material estimate for this ${jobType} project:\n\n${jobDescription}\n\nProvide:\n1. **Complete Material List** with quantities\n2. **Unit Prices** (current market rates)\n3. **Total Material Cost**\n4. **Alternative/Budget Options** where available\n5. **Supplier Recommendations**\n6. **Waste Factor** considerations`
    }
  ];
  return callOpenRouter(messages);
}

async function checkCodeCompliance(description, jurisdiction, category) {
  const messages = [
    {
      role: 'system',
      content: 'You are an expert in building codes for plumbing, electrical, and HVAC systems. Provide detailed compliance guidance based on IPC, NEC, and IMC codes.'
    },
    {
      role: 'user',
      content: `Check building code compliance for:\n\nProject: ${description}\nJurisdiction: ${jurisdiction || 'General US'}\nCategory: ${category}\n\nProvide:\n1. **Applicable Codes** and references\n2. **Requirements** that must be met\n3. **Common Violations** to avoid\n4. **Permit Requirements**\n5. **Inspection Checklist**\n6. **Compliance Recommendations**`
    }
  ];
  return callOpenRouter(messages);
}

async function optimizeSchedule(jobs) {
  const messages = [
    {
      role: 'system',
      content: 'You are an expert scheduling optimizer for plumbing, electrical, and HVAC service companies. Optimize job schedules for efficiency, customer satisfaction, and technician workload.'
    },
    {
      role: 'user',
      content: `Optimize the schedule for these jobs:\n\n${JSON.stringify(jobs, null, 2)}\n\nProvide:\n1. **Optimized Schedule** with suggested order\n2. **Route Optimization** suggestions\n3. **Time Allocation** recommendations\n4. **Priority Assessment** for each job\n5. **Potential Conflicts** or issues\n6. **Efficiency Tips**`
    }
  ];
  return callOpenRouter(messages);
}

async function generateInvoiceAnalysis(invoiceData) {
  const messages = [
    {
      role: 'system',
      content: 'You are an expert financial analyst for trades businesses. Provide insights on invoicing, pricing, and business profitability.'
    },
    {
      role: 'user',
      content: `Analyze this invoice and provide insights:\n\n${JSON.stringify(invoiceData, null, 2)}\n\nProvide:\n1. **Pricing Analysis** - is this competitive?\n2. **Margin Assessment**\n3. **Industry Benchmarks** comparison\n4. **Payment Terms** recommendations\n5. **Upsell Opportunities**\n6. **Tax Considerations**`
    }
  ];
  return callOpenRouter(messages);
}

async function analyzeTechnicianWorkload(technicians, jobs) {
  const messages = [
    {
      role: 'system',
      content: 'You are an expert workforce manager for plumbing, electrical, and HVAC service companies. Analyze technician workloads and suggest optimal job assignments based on specialty, availability, rating, and efficiency.'
    },
    {
      role: 'user',
      content: `Analyze the following technician team and jobs, then suggest optimal assignments:\n\nTechnicians:\n${JSON.stringify(technicians, null, 2)}\n\nJobs:\n${JSON.stringify(jobs, null, 2)}\n\nProvide:\n1. **Workload Assessment** for each technician\n2. **Optimal Job Assignments** based on specialty and availability\n3. **Utilization Rate** analysis\n4. **Skill Gap** identification\n5. **Recommendations** for balancing workload\n6. **Training Suggestions** based on team needs`
    }
  ];
  return callOpenRouter(messages);
}

module.exports = {
  callOpenRouter,
  analyzeJobQuote,
  estimateMaterials,
  checkCodeCompliance,
  optimizeSchedule,
  generateInvoiceAnalysis,
  analyzeTechnicianWorkload
};
