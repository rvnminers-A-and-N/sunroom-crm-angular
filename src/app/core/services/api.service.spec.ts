import { TestBed } from '@angular/core/testing';
import { HttpParams, provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ApiService,
      ],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('issues GET requests against the configured base URL with optional params', () => {
    const params = new HttpParams().set('page', '2').set('search', 'foo');
    let result: unknown;
    service.get<{ ok: boolean }>('/widgets', params).subscribe((res) => (result = res));

    const req = httpMock.expectOne((r) => r.url === `${API}/widgets`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('search')).toBe('foo');
    req.flush({ ok: true });

    expect(result).toEqual({ ok: true });
  });

  it('issues POST requests with the supplied body', () => {
    let result: unknown;
    service.post<{ id: number }>('/widgets', { name: 'A' }).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${API}/widgets`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'A' });
    req.flush({ id: 1 });

    expect(result).toEqual({ id: 1 });
  });

  it('uses an empty object as the default POST body', () => {
    let result: unknown;
    service.post<{ id: number }>('/widgets').subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${API}/widgets`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ id: 2 });

    expect(result).toEqual({ id: 2 });
  });

  it('issues PUT requests with the supplied body', () => {
    let result: unknown;
    service
      .put<{ id: number; name: string }>('/widgets/1', { name: 'B' })
      .subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${API}/widgets/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ name: 'B' });
    req.flush({ id: 1, name: 'B' });

    expect(result).toEqual({ id: 1, name: 'B' });
  });

  it('uses an empty object as the default PUT body', () => {
    let result: unknown;
    service.put('/widgets/1').subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${API}/widgets/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({});
    req.flush({});

    expect(result).toEqual({});
  });

  it('issues DELETE requests and resolves with void', () => {
    let completed = false;
    service.delete('/widgets/1').subscribe(() => (completed = true));

    const req = httpMock.expectOne(`${API}/widgets/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });
});
