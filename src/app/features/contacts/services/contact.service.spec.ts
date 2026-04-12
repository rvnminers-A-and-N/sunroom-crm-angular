import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ContactService } from './contact.service';
import { ApiService } from '@core/services/api.service';
import { makeContact, makeContactDetail, makePaginated } from '../../../../testing/fixtures';
import { environment } from '../../../../environments/environment';
import type { PaginatedResponse } from '@core/models/pagination.model';
import type { Contact } from '@core/models/contact.model';

const API = environment.apiUrl;

describe('ContactService', () => {
  let service: ContactService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ApiService,
        ContactService,
      ],
    });
    service = TestBed.inject(ContactService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getContacts', () => {
    it('issues a GET with the required pagination params', () => {
      const fixture: PaginatedResponse<Contact> = makePaginated([makeContact({ id: 7 })]);

      let result: PaginatedResponse<Contact> | undefined;
      service.getContacts({ page: 2, perPage: 25 }).subscribe((res) => (result = res));

      const req = httpMock.expectOne((r) => r.url === `${API}/contacts`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('perPage')).toBe('25');
      expect(req.request.params.get('search')).toBeNull();
      expect(req.request.params.get('companyId')).toBeNull();
      expect(req.request.params.get('tagIds')).toBeNull();
      expect(req.request.params.get('sort')).toBeNull();
      expect(req.request.params.get('direction')).toBeNull();

      req.flush(fixture);

      expect(result).toEqual(fixture);
    });

    it('appends every optional filter param when provided', () => {
      service
        .getContacts({
          page: 1,
          perPage: 10,
          search: 'ada',
          companyId: 4,
          tagId: 9,
          sort: 'lastName',
          direction: 'asc',
        })
        .subscribe();

      const req = httpMock.expectOne((r) => r.url === `${API}/contacts`);
      expect(req.request.params.get('search')).toBe('ada');
      expect(req.request.params.get('companyId')).toBe('4');
      expect(req.request.params.get('tagIds')).toBe('9');
      expect(req.request.params.get('sort')).toBe('lastName');
      expect(req.request.params.get('direction')).toBe('asc');

      req.flush(makePaginated<Contact>([]));
    });
  });

  it('getContact fetches a single contact by id', () => {
    const detail = makeContactDetail({ id: 42 });
    let result: unknown;
    service.getContact(42).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${API}/contacts/42`);
    expect(req.request.method).toBe('GET');
    req.flush(detail);

    expect(result).toEqual(detail);
  });

  it('createContact POSTs the request body', () => {
    const created = makeContact({ id: 123 });
    let result: unknown;
    service
      .createContact({ firstName: 'Grace', lastName: 'Hopper' })
      .subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${API}/contacts`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ firstName: 'Grace', lastName: 'Hopper' });
    req.flush(created);

    expect(result).toEqual(created);
  });

  it('updateContact PUTs to the contact id endpoint', () => {
    const updated = makeContact({ id: 5 });
    let result: unknown;
    service
      .updateContact(5, { firstName: 'Grace', lastName: 'Hopper', email: 'g@h.com' })
      .subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${API}/contacts/5`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      firstName: 'Grace',
      lastName: 'Hopper',
      email: 'g@h.com',
    });
    req.flush(updated);

    expect(result).toEqual(updated);
  });

  it('deleteContact DELETEs the contact id endpoint', () => {
    let completed = false;
    service.deleteContact(8).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`${API}/contacts/8`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });

  it('syncTags POSTs the tag id list to the tags endpoint', () => {
    const result = makeContact({ id: 11 });
    let response: unknown;
    service.syncTags(11, [1, 2, 3]).subscribe((res) => (response = res));

    const req = httpMock.expectOne(`${API}/contacts/11/tags`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ tagIds: [1, 2, 3] });
    req.flush(result);

    expect(response).toEqual(result);
  });
});
