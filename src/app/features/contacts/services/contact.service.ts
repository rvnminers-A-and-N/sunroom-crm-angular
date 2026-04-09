import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { PaginatedResponse } from '@core/models/pagination.model';
import { Contact, ContactDetail, ContactFilterParams, CreateContactRequest, UpdateContactRequest } from '@core/models/contact.model';

@Injectable({ providedIn: 'root' })
export class ContactService {
  constructor(private api: ApiService) {}

  getContacts(filter: ContactFilterParams): Observable<PaginatedResponse<Contact>> {
    let params = new HttpParams()
      .set('page', filter.page)
      .set('perPage', filter.perPage);

    if (filter.search) params = params.set('search', filter.search);
    if (filter.companyId) params = params.set('companyId', filter.companyId);
    if (filter.tagId) params = params.set('tagIds', filter.tagId);
    if (filter.sort) params = params.set('sort', filter.sort);
    if (filter.direction) params = params.set('direction', filter.direction);

    return this.api.get<PaginatedResponse<Contact>>('/contacts', params);
  }

  getContact(id: number): Observable<ContactDetail> {
    return this.api.get<ContactDetail>(`/contacts/${id}`);
  }

  createContact(request: CreateContactRequest): Observable<Contact> {
    return this.api.post<Contact>('/contacts', request);
  }

  updateContact(id: number, request: UpdateContactRequest): Observable<Contact> {
    return this.api.put<Contact>(`/contacts/${id}`, request);
  }

  deleteContact(id: number): Observable<void> {
    return this.api.delete(`/contacts/${id}`);
  }

  syncTags(id: number, tagIds: number[]): Observable<Contact> {
    return this.api.post<Contact>(`/contacts/${id}/tags`, { tagIds });
  }
}
