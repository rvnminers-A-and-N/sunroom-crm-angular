import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UserManagementService } from './user-management.service';
import { ApiService } from '@core/services/api.service';
import { makeUser } from '../../../../testing/fixtures';
import { environment } from '../../../../environments/environment';

const API = environment.apiUrl;

describe('UserManagementService', () => {
  let service: UserManagementService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ApiService,
        UserManagementService,
      ],
    });
    service = TestBed.inject(UserManagementService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getUsers GETs the users endpoint', () => {
    const users = [makeUser({ id: 1 }), makeUser({ id: 2 })];
    let result: unknown;
    service.getUsers().subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${API}/users`);
    expect(req.request.method).toBe('GET');
    req.flush(users);

    expect(result).toEqual(users);
  });

  it('getUser fetches a single user by id', () => {
    const user = makeUser({ id: 42 });
    let result: unknown;
    service.getUser(42).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${API}/users/42`);
    expect(req.request.method).toBe('GET');
    req.flush(user);

    expect(result).toEqual(user);
  });

  it('updateUser PUTs to the user id endpoint', () => {
    const updated = makeUser({ id: 5, role: 'Admin' });
    let result: unknown;
    service.updateUser(5, { role: 'Admin' }).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${API}/users/5`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ role: 'Admin' });
    req.flush(updated);

    expect(result).toEqual(updated);
  });

  it('deleteUser DELETEs the user id endpoint', () => {
    let completed = false;
    service.deleteUser(9).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`${API}/users/9`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(completed).toBe(true);
  });
});
