import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CompanyService } from './company.service';
import { ApiService } from '@core/services/api.service';
import { makeCompany, makeCompanyDetail, makePaginated } from '../../../../testing/fixtures';
import { environment } from '../../../../environments/environment';
import type { PaginatedResponse } from '@core/models/pagination.model';
import type { Company } from '@core/models/company.model';

const API = environment.apiUrl;

describe('CompanyService', () => {
  let service: CompanyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ApiService,
        CompanyService,
      ],
    });
    service = TestBed.inject(CompanyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getCompanies', () => {
    it('issues a GET with pagination params and no search by default', () => {
      const fixture: PaginatedResponse<Company> = makePaginated([makeCompany({ id: 7 })]);

      let result: PaginatedResponse<Company> | undefined;
      service.getCompanies(2, 25).subscribe((res) => (result = res));

      const req = httpMock.expectOne((r) => r.url === `${API}/companies`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('perPage')).toBe('25');
      expect(req.request.params.get('search')).toBeNull();

      req.flush(fixture);

      expect(result).toEqual(fixture);
    });

    it('appends the search param when provided', () => {
      service.getCompanies(1, 10, 'acme').subscribe();

      const req = httpMock.expectOne((r) => r.url === `${API}/companies`);
      expect(req.request.params.get('search')).toBe('acme');

      req.flush(makePaginated<Company>([]));
    });
  });

  it('getCompany fetches a single company by id', () => {
    const detail = makeCompanyDetail({ id: 42 });
    let result: unknown;
    service.getCompany(42).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${API}/companies/42`);
    expect(req.request.method).toBe('GET');
    req.flush(detail);

    expect(result).toEqual(detail);
  });

  it('createCompany POSTs the request body', () => {
    const created = makeCompany({ id: 123 });
    let result: unknown;
    service
      .createCompany({ name: 'New Co' })
      .subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${API}/companies`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'New Co' });
    req.flush(created);

    expect(result).toEqual(created);
  });

  it('updateCompany PUTs to the company id endpoint', () => {
    const updated = makeCompany({ id: 5 });
    let result: unknown;
    service
      .updateCompany(5, { name: 'Renamed', industry: 'Tech' })
      .subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${API}/companies/5`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ name: 'Renamed', industry: 'Tech' });
    req.flush(updated);

    expect(result).toEqual(updated);
  });

  it('deleteCompany DELETEs the company id endpoint', () => {
    let completed = false;
    service.deleteCompany(8).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`${API}/companies/8`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });
});
