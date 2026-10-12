import React from 'react';
import fs from 'fs';
import path from 'path';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import api from '../services/api';
import { ToastContext } from '../App';
import Customers from './Customers';
import JobQuotes from './JobQuotes';
import Projects from './Projects';
import Reports from './Reports';
import Dashboard from './Dashboard';
import Materials from './Materials';
import CodeCompliance from './CodeCompliance';
import Schedules from './Schedules';
import Invoices from './Invoices';
import Technicians from './Technicians';
import Expenses from './Expenses';
import Warranties from './Warranties';
import Equipment from './Equipment';
import ServiceContracts from './ServiceContracts';
import Permits from './Permits';
import Suppliers from './Suppliers';
import { listPayload } from '../services/listPayload';

jest.mock('../services/api', () => ({ get: jest.fn(), post: jest.fn() }));

const seed = fs.readFileSync(path.join(__dirname, '../../../backend/src/seeds/seed.js'), 'utf8');
function seeded(model) {
  const match = seed.match(new RegExp(`await ${model}\\.bulkCreate\\(\\[([\\s\\S]*?)\\]\\);`));
  if (!match) throw new Error(`Missing ${model} seed fixture`);
  return Function('uid', `return [${match[1]}]`)(1).map((item, index) => ({ id: index + 1, ...item }));
}
const fixtures = {
  '/customers': { customers: seeded('Customer'), total: 15, page: 1, totalPages: 1 },
  '/job-quotes': { quotes: seeded('JobQuote'), total: 15, page: 1, totalPages: 1 },
  '/projects': { data: seeded('Project'), pagination: { total: 15, page: 1, totalPages: 1 } },
  '/materials': seeded('Material'),
  '/invoices': seeded('Invoice'),
  '/expenses': seeded('Expense'),
  '/schedules': seeded('Schedule'),
  '/technicians': seeded('Technician'),
  '/service-contracts': seeded('ServiceContract'),
  '/code-compliance': seeded('CodeCompliance'),
  '/warranties': seeded('Warranty'),
  '/equipment': seeded('Equipment'),
  '/permits': seeded('Permit'),
  '/suppliers': seeded('Supplier'),
};
const mount = (Component) => render(<ToastContext.Provider value={jest.fn()}><MemoryRouter><Component /></MemoryRouter></ToastContext.Provider>);

beforeEach(() => {
  api.get.mockImplementation(async (url) => ({ data: fixtures[url.split('?')[0]] || [] }));
});
afterEach(() => { cleanup(); jest.clearAllMocks(); });

test.each([
  ['customers', Customers], ['quotes', JobQuotes], ['projects', Projects],
  ['materials', Materials], ['codecompliance', CodeCompliance], ['schedules', Schedules], ['invoices', Invoices], ['technicians', Technicians], ['expenses', Expenses], ['warranties', Warranties], ['equipment', Equipment], ['servicecontracts', ServiceContracts], ['permits', Permits], ['suppliers', Suppliers]
])('%s list renders 15 real project seed records', async (_name, Component) => {
  const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
  const { container } = mount(Component);
  await waitFor(() => expect(container.querySelectorAll('table.data-table tbody tr')).toHaveLength(15));
  expect(errors.mock.calls.filter(([message]) => !String(message).includes('ReactDOMTestUtils.act'))).toHaveLength(0);
  errors.mockRestore();
});

test('reports unwraps all three paginated routes and renders 15 customer cards', async () => {
  const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
  const { container } = mount(Reports);
  await waitFor(() => expect(screen.getByText('Top 15 Spenders')).toBeTruthy());
  expect(container.textContent).toContain('Total Customers');
  expect(container.textContent).toContain('15');
  expect(screen.getByText(/15\. /)).toBeTruthy();
  expect(errors.mock.calls.filter(([message]) => !String(message).includes('ReactDOMTestUtils.act'))).toHaveLength(0);
  errors.mockRestore();
});

test('non-array envelopes never become record collections', () => {
  expect(listPayload({ data: { error: 'bad response' } })).toEqual([]);
  expect(listPayload({ quotes: {} }, 'quotes')).toEqual([]);
});

test('dashboard shows 15 recent records from the project seed', async () => {
  const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
  const { container } = mount(Dashboard);
  await waitFor(() => expect(container.querySelectorAll('.activity-item')).toHaveLength(15));
  expect(errors.mock.calls.filter(([message]) => !String(message).includes('ReactDOMTestUtils.act'))).toHaveLength(0);
  errors.mockRestore();
});
