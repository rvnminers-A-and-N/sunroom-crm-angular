import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { http, HttpResponse } from 'msw';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';
import { TagService } from './tag.service';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';
import { server } from '../../../testing/msw/server';
import { makeTag } from '../../../testing/fixtures';

const API = environment.apiUrl;

describe('TagService', () => {
  let service: TagService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), ApiService, TagService],
    });
    service = TestBed.inject(TagService);
  });

  it('getTags returns the list from the API', async () => {
    const fixtures = [makeTag({ id: 10 }), makeTag({ id: 11, name: 'Customer' })];
    server.use(http.get(`${API}/tags`, () => HttpResponse.json(fixtures)));

    const result = await firstValueFrom(service.getTags());

    expect(result).toEqual(fixtures);
  });

  it('createTag posts the request body', async () => {
    let receivedBody: unknown = null;
    const created = makeTag({ id: 50, name: 'New', color: '#fff000' });
    server.use(
      http.post(`${API}/tags`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json(created);
      }),
    );

    const result = await firstValueFrom(
      service.createTag({ name: 'New', color: '#fff000' }),
    );

    expect(result).toEqual(created);
    expect(receivedBody).toEqual({ name: 'New', color: '#fff000' });
  });

  it('updateTag puts to the id-scoped URL', async () => {
    let receivedUrl = '';
    let receivedBody: unknown = null;
    const updated = makeTag({ id: 7, name: 'Updated', color: '#aabbcc' });
    server.use(
      http.put(`${API}/tags/7`, async ({ request }) => {
        receivedUrl = request.url;
        receivedBody = await request.json();
        return HttpResponse.json(updated);
      }),
    );

    const result = await firstValueFrom(
      service.updateTag(7, { name: 'Updated', color: '#aabbcc' }),
    );

    expect(result).toEqual(updated);
    expect(receivedUrl).toContain('/tags/7');
    expect(receivedBody).toEqual({ name: 'Updated', color: '#aabbcc' });
  });

  it('deleteTag deletes the id-scoped URL', async () => {
    let receivedUrl = '';
    server.use(
      http.delete(`${API}/tags/9`, ({ request }) => {
        receivedUrl = request.url;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await firstValueFrom(service.deleteTag(9));

    expect(receivedUrl).toContain('/tags/9');
  });
});
