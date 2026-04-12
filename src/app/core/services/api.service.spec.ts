import { TestBed } from '@angular/core/testing';
import { HttpParams, provideHttpClient } from '@angular/common/http';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeEach } from 'vitest';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';
import { server } from '../../../testing/msw/server';

const API = environment.apiUrl;

describe('ApiService', () => {
  let service: ApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), ApiService],
    });
    service = TestBed.inject(ApiService);
  });

  it('issues GET requests against the configured base URL with optional params', async () => {
    let receivedUrl = '';
    server.use(
      http.get(`${API}/widgets`, ({ request }) => {
        receivedUrl = request.url;
        return HttpResponse.json({ ok: true });
      }),
    );

    const params = new HttpParams().set('page', '2').set('search', 'foo');
    const result = await new Promise((resolve) =>
      service.get<{ ok: boolean }>('/widgets', params).subscribe(resolve),
    );

    expect(result).toEqual({ ok: true });
    expect(receivedUrl).toContain('/widgets');
    expect(receivedUrl).toContain('page=2');
    expect(receivedUrl).toContain('search=foo');
  });

  it('issues POST requests with the supplied body', async () => {
    let receivedBody: unknown = null;
    server.use(
      http.post(`${API}/widgets`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ id: 1 });
      }),
    );

    const result = await new Promise((resolve) =>
      service.post<{ id: number }>('/widgets', { name: 'A' }).subscribe(resolve),
    );

    expect(result).toEqual({ id: 1 });
    expect(receivedBody).toEqual({ name: 'A' });
  });

  it('uses an empty object as the default POST body', async () => {
    let receivedBody: unknown = null;
    server.use(
      http.post(`${API}/widgets`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ id: 2 });
      }),
    );

    await new Promise((resolve) => service.post<{ id: number }>('/widgets').subscribe(resolve));

    expect(receivedBody).toEqual({});
  });

  it('issues PUT requests with the supplied body', async () => {
    let receivedBody: unknown = null;
    server.use(
      http.put(`${API}/widgets/1`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ id: 1, name: 'B' });
      }),
    );

    const result = await new Promise((resolve) =>
      service.put<{ id: number; name: string }>('/widgets/1', { name: 'B' }).subscribe(resolve),
    );

    expect(result).toEqual({ id: 1, name: 'B' });
    expect(receivedBody).toEqual({ name: 'B' });
  });

  it('uses an empty object as the default PUT body', async () => {
    let receivedBody: unknown = null;
    server.use(
      http.put(`${API}/widgets/1`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({});
      }),
    );

    await new Promise((resolve) => service.put('/widgets/1').subscribe(resolve));

    expect(receivedBody).toEqual({});
  });

  it('issues DELETE requests and resolves with void', async () => {
    let called = false;
    server.use(
      http.delete(`${API}/widgets/1`, () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const result = await new Promise((resolve) => service.delete('/widgets/1').subscribe(resolve));

    expect(called).toBe(true);
    expect(result).toBeNull();
  });
});
