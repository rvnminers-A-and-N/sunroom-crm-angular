import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/services/auth.service';
import { streamSSE } from '@core/api/sse-stream';
import { SummarizeRequest, SummarizeResponse, SmartSearchRequest, SmartSearchResponse } from '@core/models/ai.model';
import { DealInsight } from '@core/models/deal.model';

@Injectable({ providedIn: 'root' })
export class AiService {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  summarize(text: string): Observable<SummarizeResponse> {
    return this.api.post<SummarizeResponse>('/ai/summarize', { text } as SummarizeRequest);
  }

  summarizeStream(text: string, signal?: AbortSignal): AsyncGenerator<string, void, undefined> {
    return streamSSE('/ai/summarize/stream', { text }, this.auth.getToken(), signal);
  }

  generateDealInsights(dealId: number): Observable<DealInsight> {
    return this.api.post<DealInsight>(`/ai/deal-insights/${dealId}`, {});
  }

  smartSearch(query: string): Observable<SmartSearchResponse> {
    return this.api.post<SmartSearchResponse>('/ai/search', { query } as SmartSearchRequest);
  }

  smartSearchStream(query: string, signal?: AbortSignal): AsyncGenerator<string, void, undefined> {
    return streamSSE('/ai/search/stream', { query }, this.auth.getToken(), signal);
  }

  dealInsightsStream(dealId: number, signal?: AbortSignal): AsyncGenerator<string, void, undefined> {
    return streamSSE(`/ai/deal-insights/${dealId}/stream`, {}, this.auth.getToken(), signal);
  }
}
