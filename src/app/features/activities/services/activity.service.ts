import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { PaginatedResponse } from '@core/models/pagination.model';
import { Activity, ActivityFilterParams, CreateActivityRequest, UpdateActivityRequest } from '@core/models/activity.model';

@Injectable({ providedIn: 'root' })
export class ActivityService {
  constructor(private api: ApiService) {}

  getActivities(filter: ActivityFilterParams): Observable<PaginatedResponse<Activity>> {
    let params = new HttpParams()
      .set('page', filter.page)
      .set('perPage', filter.perPage);

    if (filter.contactId) params = params.set('contactId', filter.contactId);
    if (filter.dealId) params = params.set('dealId', filter.dealId);
    if (filter.type) params = params.set('type', filter.type);
    if (filter.sort) params = params.set('sort', filter.sort);
    if (filter.direction) params = params.set('direction', filter.direction);

    return this.api.get<PaginatedResponse<Activity>>('/activities', params);
  }

  getActivity(id: number): Observable<Activity> {
    return this.api.get<Activity>(`/activities/${id}`);
  }

  createActivity(request: CreateActivityRequest): Observable<Activity> {
    return this.api.post<Activity>('/activities', request);
  }

  updateActivity(id: number, request: UpdateActivityRequest): Observable<Activity> {
    return this.api.put<Activity>(`/activities/${id}`, request);
  }

  deleteActivity(id: number): Observable<void> {
    return this.api.delete(`/activities/${id}`);
  }
}
