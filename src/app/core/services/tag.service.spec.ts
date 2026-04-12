import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TagService } from './tag.service';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';
import { makeTag } from '../../../testing/fixtures';

const API = environment.apiUrl;

describe('TagService', () => {
  let service: TagService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ApiService,
        TagService,
      ],
    });
    service = TestBed.inject(TagService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getTags returns the list from the API', () => {
    const fixtures = [makeTag({ id: 10 }), makeTag({ id: 11, name: 'Customer' })];
    let result: unknown;
    service.getTags().subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${API}/tags`);
    expect(req.request.method).toBe('GET');
    req.flush(fixtures);

    expect(result).toEqual(fixtures);
  });

  it('createTag posts the request body', () => {
    const created = makeTag({ id: 50, name: 'New', color: '#fff000' });
    let result: unknown;
    service.createTag({ name: 'New', color: '#fff000' }).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${API}/tags`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'New', color: '#fff000' });
    req.flush(created);

    expect(result).toEqual(created);
  });

  it('updateTag puts to the id-scoped URL', () => {
    const updated = makeTag({ id: 7, name: 'Updated', color: '#aabbcc' });
    let result: unknown;
    service
      .updateTag(7, { name: 'Updated', color: '#aabbcc' })
      .subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${API}/tags/7`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ name: 'Updated', color: '#aabbcc' });
    req.flush(updated);

    expect(result).toEqual(updated);
  });

  it('deleteTag deletes the id-scoped URL', () => {
    let completed = false;
    service.deleteTag(9).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`${API}/tags/9`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });
});
