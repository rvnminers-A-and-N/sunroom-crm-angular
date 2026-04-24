import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AiService } from './ai.service';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/services/auth.service';
import { environment } from '../../../../environments/environment';

const API = environment.apiUrl;

/** Build a minimal Response whose body is a ReadableStream of SSE lines. */
function sseResponse(raw: string, status = 200): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(raw));
      controller.close();
    },
  });
  return new Response(stream, {
    status,
    statusText: status === 200 ? 'OK' : 'Error',
  });
}

/** Collect every yielded value from an async generator into an array. */
async function collect(
  gen: AsyncGenerator<string, void, undefined>,
): Promise<string[]> {
  const tokens: string[] = [];
  for await (const t of gen) {
    tokens.push(t);
  }
  return tokens;
}

describe('AiService', () => {
  let service: AiService;
  let httpMock: HttpTestingController;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('sunroom_token', 'test-jwt');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ApiService,
        AuthService,
        AiService,
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    service = TestBed.inject(AiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    globalThis.fetch = originalFetch;
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
    const response = {
      interpretation: 'people you talked to',
      contacts: [],
      activities: [],
    };
    let result: unknown;
    service.smartSearch('who did I talk to').subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${API}/ai/search`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ query: 'who did I talk to' });
    req.flush(response);

    expect(result).toEqual(response);
  });

  describe('summarizeStream', () => {
    it('returns an async generator that yields tokens via streamSSE', async () => {
      const body =
        'data: {"token":"sum"}\n\ndata: {"token":"mary"}\n\ndata: [DONE]\n\n';
      globalThis.fetch = vi.fn().mockResolvedValue(sseResponse(body));

      const tokens = await collect(service.summarizeStream('hello'));

      expect(tokens).toEqual(['sum', 'mary']);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ai/summarize/stream'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ text: 'hello' }),
        }),
      );
    });
  });

  describe('smartSearchStream', () => {
    it('returns an async generator that yields tokens via streamSSE', async () => {
      const body =
        'data: {"token":"search"}\n\ndata: {"token":" result"}\n\ndata: [DONE]\n\n';
      globalThis.fetch = vi.fn().mockResolvedValue(sseResponse(body));

      const tokens = await collect(service.smartSearchStream('query'));

      expect(tokens).toEqual(['search', ' result']);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ai/search/stream'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ query: 'query' }),
        }),
      );
    });
  });

  describe('dealInsightsStream', () => {
    it('returns an async generator that yields tokens via streamSSE', async () => {
      const body =
        'data: {"token":"deal"}\n\ndata: {"token":" insight"}\n\ndata: [DONE]\n\n';
      globalThis.fetch = vi.fn().mockResolvedValue(sseResponse(body));

      const tokens = await collect(service.dealInsightsStream(42));

      expect(tokens).toEqual(['deal', ' insight']);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ai/deal-insights/42/stream'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({}),
        }),
      );
    });
  });
});
