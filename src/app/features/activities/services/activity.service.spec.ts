import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ActivityService } from './activity.service';
import { ApiService } from '@core/services/api.service';
import { makeActivity, makePaginated } from '../../../../testing/fixtures';
import { environment } from '../../../../environments/environment';
import type { PaginatedResponse } from '@core/models/pagination.model';
import type { Activity } from '@core/models/activity.model';

const API = environment.apiUrl;

describe('ActivityService', () => {
  let service: ActivityService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ApiService,
        ActivityService,
      ],
    });
    service = TestBed.inject(ActivityService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getActivities', () => {
    it('issues a GET with the required pagination params and no optional filters', () => {
      const fixture: PaginatedResponse<Activity> = makePaginated([makeActivity({ id: 7 })]);

      let result: PaginatedResponse<Activity> | undefined;
      service.getActivities({ page: 2, perPage: 25 }).subscribe((res) => (result = res));

      const req = httpMock.expectOne((r) => r.url === `${API}/activities`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('perPage')).toBe('25');
      expect(req.request.params.get('contactId')).toBeNull();
      expect(req.request.params.get('dealId')).toBeNull();
      expect(req.request.params.get('type')).toBeNull();
      expect(req.request.params.get('sort')).toBeNull();
      expect(req.request.params.get('direction')).toBeNull();

      req.flush(fixture);

      expect(result).toEqual(fixture);
    });

    it('appends every optional filter param when provided', () => {
      service
        .getActivities({
          page: 1,
          perPage: 10,
          contactId: 5,
          dealId: 9,
          type: 'Call',
          sort: 'occurredAt',
          direction: 'desc',
        })
        .subscribe();

      const req = httpMock.expectOne((r) => r.url === `${API}/activities`);
      expect(req.request.params.get('contactId')).toBe('5');
      expect(req.request.params.get('dealId')).toBe('9');
      expect(req.request.params.get('type')).toBe('Call');
      expect(req.request.params.get('sort')).toBe('occurredAt');
      expect(req.request.params.get('direction')).toBe('desc');

      req.flush(makePaginated<Activity>([]));
    });
  });

  it('getActivity fetches a single activity by id', () => {
    const activity = makeActivity({ id: 42 });
    let result: unknown;
    service.getActivity(42).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${API}/activities/42`);
    expect(req.request.method).toBe('GET');
    req.flush(activity);

    expect(result).toEqual(activity);
  });

  it('createActivity POSTs the request body', () => {
    const created = makeActivity({ id: 123 });
    let result: unknown;
    service
      .createActivity({ type: 'Note', subject: 'New' })
      .subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${API}/activities`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ type: 'Note', subject: 'New' });
    req.flush(created);

    expect(result).toEqual(created);
  });

  it('updateActivity PUTs to the activity id endpoint', () => {
    const updated = makeActivity({ id: 5 });
    let result: unknown;
    service
      .updateActivity(5, { type: 'Call', subject: 'Updated' })
      .subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${API}/activities/5`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ type: 'Call', subject: 'Updated' });
    req.flush(updated);

    expect(result).toEqual(updated);
  });

  it('deleteActivity DELETEs the activity id endpoint', () => {
    let completed = false;
    service.deleteActivity(9).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`${API}/activities/9`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(completed).toBe(true);
  });
});
