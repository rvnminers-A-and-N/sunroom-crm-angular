import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AiService } from './ai.service';
import { ApiService } from '@core/services/api.service';
import { environment } from '../../../../environments/environment';

const API = environment.apiUrl;

describe('AiService', () => {
  let service: AiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ApiService,
        AiService,
      ],
    });
    service = TestBed.inject(AiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('summarize POSTs the text to the summarize endpoint', () => {
    const response = { summary: 'short' };
    let result: unknown;
    service.summarize('long body of text').subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${API}/ai/summarize`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ text: 'long body of text' });
    req.flush(response);

    expect(result).toEqual(response);
  });

  it('generateDealInsights POSTs to the deal-insights endpoint with an empty body', () => {
    const insight = {
      id: 1,
      insight: 'Looks promising',
      generatedAt: '2025-01-01T00:00:00.000Z',
    };
    let result: unknown;
    service.generateDealInsights(42).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${API}/ai/deal-insights/42`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush(insight);

    expect(result).toEqual(insight);
  });

  it('smartSearch POSTs the query to the search endpoint', () => {
    const response = { interpretation: 'people you talked to', contacts: [], activities: [] };
    let result: unknown;
    service.smartSearch('who did I talk to').subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${API}/ai/search`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ query: 'who did I talk to' });
    req.flush(response);

    expect(result).toEqual(response);
  });
});
