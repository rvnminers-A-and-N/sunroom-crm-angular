import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { PaginatedResponse } from '@core/models/pagination.model';
import { Company, CompanyDetail, CreateCompanyRequest, UpdateCompanyRequest } from '@core/models/company.model';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  constructor(private api: ApiService) {}

  getCompanies(page: number, perPage: number, search?: string): Observable<PaginatedResponse<Company>> {
    let params = new HttpParams()
      .set('page', page)
      .set('perPage', perPage);

    if (search) params = params.set('search', search);

    return this.api.get<PaginatedResponse<Company>>('/companies', params);
  }

  getCompany(id: number): Observable<CompanyDetail> {
    return this.api.get<CompanyDetail>(`/companies/${id}`);
  }

  createCompany(request: CreateCompanyRequest): Observable<Company> {
    return this.api.post<Company>('/companies', request);
  }

  updateCompany(id: number, request: UpdateCompanyRequest): Observable<Company> {
    return this.api.put<Company>(`/companies/${id}`, request);
  }

  deleteCompany(id: number): Observable<void> {
    return this.api.delete(`/companies/${id}`);
  }
}
