import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { PaginatedResponse } from '@core/models/pagination.model';
import { Deal, DealDetail, DealFilterParams, CreateDealRequest, UpdateDealRequest, Pipeline } from '@core/models/deal.model';

@Injectable({ providedIn: 'root' })
export class DealService {
  constructor(private api: ApiService) {}

  getDeals(filter: DealFilterParams): Observable<PaginatedResponse<Deal>> {
    let params = new HttpParams()
      .set('page', filter.page)
      .set('perPage', filter.perPage);

    if (filter.search) params = params.set('search', filter.search);
    if (filter.stage) params = params.set('stage', filter.stage);
    if (filter.sort) params = params.set('sort', filter.sort);
    if (filter.direction) params = params.set('direction', filter.direction);

    return this.api.get<PaginatedResponse<Deal>>('/deals', params);
  }

  getDeal(id: number): Observable<DealDetail> {
    return this.api.get<DealDetail>(`/deals/${id}`);
  }

  getPipeline(): Observable<Pipeline> {
    return this.api.get<Pipeline>('/deals/pipeline');
  }

  createDeal(request: CreateDealRequest): Observable<Deal> {
    return this.api.post<Deal>('/deals', request);
  }

  updateDeal(id: number, request: UpdateDealRequest): Observable<Deal> {
    return this.api.put<Deal>(`/deals/${id}`, request);
  }

  deleteDeal(id: number): Observable<void> {
    return this.api.delete(`/deals/${id}`);
  }
}
