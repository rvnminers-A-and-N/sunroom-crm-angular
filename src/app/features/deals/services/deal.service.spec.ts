import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DealService } from './deal.service';
import { ApiService } from '@core/services/api.service';
import { makeDeal, makeDealDetail, makePipeline, makePaginated } from '../../../../testing/fixtures';
import { environment } from '../../../../environments/environment';
import type { PaginatedResponse } from '@core/models/pagination.model';
import type { Deal } from '@core/models/deal.model';

const API = environment.apiUrl;

describe('DealService', () => {
  let service: DealService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ApiService,
        DealService,
      ],
    });
    service = TestBed.inject(DealService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getDeals', () => {
    it('issues a GET with the required pagination params', () => {
      const fixture: PaginatedResponse<Deal> = makePaginated([makeDeal({ id: 7 })]);

      let result: PaginatedResponse<Deal> | undefined;
      service.getDeals({ page: 2, perPage: 25 }).subscribe((res) => (result = res));

      const req = httpMock.expectOne((r) => r.url === `${API}/deals`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('perPage')).toBe('25');
      expect(req.request.params.get('search')).toBeNull();
      expect(req.request.params.get('stage')).toBeNull();
      expect(req.request.params.get('sort')).toBeNull();
      expect(req.request.params.get('direction')).toBeNull();

      req.flush(fixture);

      expect(result).toEqual(fixture);
    });

    it('appends every optional filter param when provided', () => {
      service
        .getDeals({
          page: 1,
          perPage: 10,
          search: 'big',
          stage: 'Qualified',
          sort: 'value',
          direction: 'desc',
        })
        .subscribe();

      const req = httpMock.expectOne((r) => r.url === `${API}/deals`);
      expect(req.request.params.get('search')).toBe('big');
      expect(req.request.params.get('stage')).toBe('Qualified');
      expect(req.request.params.get('sort')).toBe('value');
      expect(req.request.params.get('direction')).toBe('desc');

      req.flush(makePaginated<Deal>([]));
    });
  });

  it('getDeal fetches a single deal by id', () => {
    const detail = makeDealDetail({ id: 42 });
    let result: unknown;
    service.getDeal(42).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${API}/deals/42`);
    expect(req.request.method).toBe('GET');
    req.flush(detail);

    expect(result).toEqual(detail);
  });

  it('getPipeline GETs the pipeline endpoint', () => {
    const pipeline = makePipeline();
    let result: unknown;
    service.getPipeline().subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${API}/deals/pipeline`);
    expect(req.request.method).toBe('GET');
    req.flush(pipeline);

    expect(result).toEqual(pipeline);
  });

  it('createDeal POSTs the request body', () => {
    const created = makeDeal({ id: 123 });
    let result: unknown;
    service
      .createDeal({ title: 'New', value: 100, contactId: 1, stage: 'Lead' })
      .subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${API}/deals`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ title: 'New', value: 100, contactId: 1, stage: 'Lead' });
    req.flush(created);

    expect(result).toEqual(created);
  });

  it('updateDeal PUTs to the deal id endpoint', () => {
    const updated = makeDeal({ id: 5 });
    let result: unknown;
    service
      .updateDeal(5, { title: 'Updated', value: 200, contactId: 1, stage: 'Won' })
      .subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${API}/deals/5`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      title: 'Updated',
      value: 200,
      contactId: 1,
      stage: 'Won',
    });
    req.flush(updated);

    expect(result).toEqual(updated);
  });

  it('deleteDeal DELETEs the deal id endpoint', () => {
    let completed = false;
    service.deleteDeal(8).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`${API}/deals/8`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });
});
