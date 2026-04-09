import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Tag, CreateTagRequest, UpdateTagRequest } from '@core/models/tag.model';

@Injectable({ providedIn: 'root' })
export class TagService {
  constructor(private api: ApiService) {}

  getTags(): Observable<Tag[]> {
    return this.api.get<Tag[]>('/tags');
  }

  createTag(request: CreateTagRequest): Observable<Tag> {
    return this.api.post<Tag>('/tags', request);
  }

  updateTag(id: number, request: UpdateTagRequest): Observable<Tag> {
    return this.api.put<Tag>(`/tags/${id}`, request);
  }

  deleteTag(id: number): Observable<void> {
    return this.api.delete(`/tags/${id}`);
  }
}
