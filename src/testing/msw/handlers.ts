import { http, HttpResponse } from 'msw';
import { environment } from '../../environments/environment';
import {
  makeContact,
  makeContactDetail,
  makeCompany,
  makeCompanyDetail,
  makeDeal,
  makeDealDetail,
  makePipeline,
  makeActivity,
  makeTag,
  makeUser,
  makeAuthResponse,
  makeDashboard,
  makePaginated,
} from '../fixtures';

const API = environment.apiUrl;

/**
 * Default handlers for the test suite.
 *
 * Each handler returns deterministic, minimal data so tests don't depend on
 * shared mutable state. Individual tests can override any handler with
 * `server.use(http.get(..., ...))` to simulate failures, empty results, etc.
 */
export const handlers = [
  // ----- Auth ---------------------------------------------------------------
  http.post(`${API}/auth/login`, () => HttpResponse.json(makeAuthResponse())),
  http.post(`${API}/auth/register`, () => HttpResponse.json(makeAuthResponse())),
  http.get(`${API}/auth/me`, () => HttpResponse.json(makeUser())),

  // ----- Tags ---------------------------------------------------------------
  http.get(`${API}/tags`, () => HttpResponse.json([makeTag({ id: 1 }), makeTag({ id: 2 })])),
  http.post(`${API}/tags`, () => HttpResponse.json(makeTag({ id: 3 }))),
  http.put(`${API}/tags/:id`, ({ params }) =>
    HttpResponse.json(makeTag({ id: Number(params['id']) })),
  ),
  http.delete(`${API}/tags/:id`, () => new HttpResponse(null, { status: 204 })),

  // ----- Contacts -----------------------------------------------------------
  http.get(`${API}/contacts`, () =>
    HttpResponse.json(makePaginated([makeContact({ id: 1 }), makeContact({ id: 2 })])),
  ),
  http.get(`${API}/contacts/:id`, ({ params }) =>
    HttpResponse.json(makeContactDetail({ id: Number(params['id']) })),
  ),
  http.post(`${API}/contacts`, () => HttpResponse.json(makeContact({ id: 99 }))),
  http.put(`${API}/contacts/:id`, ({ params }) =>
    HttpResponse.json(makeContact({ id: Number(params['id']) })),
  ),
  http.delete(`${API}/contacts/:id`, () => new HttpResponse(null, { status: 204 })),
  http.post(`${API}/contacts/:id/tags`, ({ params }) =>
    HttpResponse.json(makeContact({ id: Number(params['id']) })),
  ),

  // ----- Companies ----------------------------------------------------------
  http.get(`${API}/companies`, () =>
    HttpResponse.json(makePaginated([makeCompany({ id: 1 }), makeCompany({ id: 2 })])),
  ),
  http.get(`${API}/companies/:id`, ({ params }) =>
    HttpResponse.json(makeCompanyDetail({ id: Number(params['id']) })),
  ),
  http.post(`${API}/companies`, () => HttpResponse.json(makeCompany({ id: 99 }))),
  http.put(`${API}/companies/:id`, ({ params }) =>
    HttpResponse.json(makeCompany({ id: Number(params['id']) })),
  ),
  http.delete(`${API}/companies/:id`, () => new HttpResponse(null, { status: 204 })),

  // ----- Deals --------------------------------------------------------------
  http.get(`${API}/deals/pipeline`, () => HttpResponse.json(makePipeline())),
  http.get(`${API}/deals`, () =>
    HttpResponse.json(makePaginated([makeDeal({ id: 1 }), makeDeal({ id: 2 })])),
  ),
  http.get(`${API}/deals/:id`, ({ params }) =>
    HttpResponse.json(makeDealDetail({ id: Number(params['id']) })),
  ),
  http.post(`${API}/deals`, () => HttpResponse.json(makeDeal({ id: 99 }))),
  http.put(`${API}/deals/:id`, ({ params }) =>
    HttpResponse.json(makeDeal({ id: Number(params['id']) })),
  ),
  http.delete(`${API}/deals/:id`, () => new HttpResponse(null, { status: 204 })),

  // ----- Activities ---------------------------------------------------------
  http.get(`${API}/activities`, () =>
    HttpResponse.json(makePaginated([makeActivity({ id: 1 }), makeActivity({ id: 2 })])),
  ),
  http.get(`${API}/activities/:id`, ({ params }) =>
    HttpResponse.json(makeActivity({ id: Number(params['id']) })),
  ),
  http.post(`${API}/activities`, () => HttpResponse.json(makeActivity({ id: 99 }))),
  http.put(`${API}/activities/:id`, ({ params }) =>
    HttpResponse.json(makeActivity({ id: Number(params['id']) })),
  ),
  http.delete(`${API}/activities/:id`, () => new HttpResponse(null, { status: 204 })),

  // ----- Dashboard ----------------------------------------------------------
  http.get(`${API}/dashboard`, () => HttpResponse.json(makeDashboard())),

  // ----- Users (admin) ------------------------------------------------------
  http.get(`${API}/users`, () =>
    HttpResponse.json([makeUser({ id: 1 }), makeUser({ id: 2, role: 'Admin' })]),
  ),
  http.get(`${API}/users/:id`, ({ params }) =>
    HttpResponse.json(makeUser({ id: Number(params['id']) })),
  ),
  http.put(`${API}/users/:id`, ({ params }) =>
    HttpResponse.json(makeUser({ id: Number(params['id']) })),
  ),
  http.delete(`${API}/users/:id`, () => new HttpResponse(null, { status: 204 })),

  // ----- AI -----------------------------------------------------------------
  http.post(`${API}/ai/summarize`, () => HttpResponse.json({ summary: 'A short summary.' })),
  http.post(`${API}/ai/deal-insights/:id`, ({ params }) =>
    HttpResponse.json({
      id: Number(params['id']),
      insight: 'This deal looks promising.',
      generatedAt: '2025-01-01T00:00:00.000Z',
    }),
  ),
  http.post(`${API}/ai/search`, () =>
    HttpResponse.json({
      interpretation: 'Looking for contacts.',
      contacts: [makeContact({ id: 1 })],
      activities: [makeActivity({ id: 1 })],
    }),
  ),
];
