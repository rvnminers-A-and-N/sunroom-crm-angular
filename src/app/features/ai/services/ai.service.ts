import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { SummarizeRequest, SummarizeResponse, SmartSearchRequest, SmartSearchResponse } from '@core/models/ai.model';
import { DealInsight } from '@core/models/deal.model';

@Injectable({ providedIn: 'root' })
export class AiService {
  constructor(private api: ApiService) {}

  summarize(text: string): Observable<SummarizeResponse> {
    return this.api.post<SummarizeResponse>('/ai/summarize', { text } as SummarizeRequest);
  }

  generateDealInsights(dealId: number): Observable<DealInsight> {
    return this.api.post<DealInsight>(`/ai/deal-insights/${dealId}`, {});
  }

  smartSearch(query: string): Observable<SmartSearchResponse> {
    return this.api.post<SmartSearchResponse>('/ai/search', { query } as SmartSearchRequest);
  }
}
