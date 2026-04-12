import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DashboardService } from './dashboard.service';
import { ApiService } from '@core/services/api.service';
import { makeDashboard } from '../../../../testing/fixtures';
import { environment } from '../../../../environments/environment';

const API = environment.apiUrl;

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ApiService,
        DashboardService,
      ],
    });
    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getDashboard issues a GET to the dashboard endpoint', () => {
    const fixture = makeDashboard();
    let result: unknown;
    service.getDashboard().subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${API}/dashboard`);
    expect(req.request.method).toBe('GET');
    req.flush(fixture);

    expect(result).toEqual(fixture);
  });
});
