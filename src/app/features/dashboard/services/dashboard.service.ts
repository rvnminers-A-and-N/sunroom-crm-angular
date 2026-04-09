import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { DashboardData } from '@core/models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private api: ApiService) {}

  getDashboard(): Observable<DashboardData> {
    return this.api.get<DashboardData>('/dashboard');
  }
}
