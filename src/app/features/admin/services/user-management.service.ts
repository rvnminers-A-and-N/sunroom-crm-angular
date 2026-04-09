import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { User, UpdateUserRequest } from '@core/models/user.model';

@Injectable({ providedIn: 'root' })
export class UserManagementService {
  constructor(private api: ApiService) {}

  getUsers(): Observable<User[]> {
    return this.api.get<User[]>('/users');
  }

  getUser(id: number): Observable<User> {
    return this.api.get<User>(`/users/${id}`);
  }

  updateUser(id: number, request: UpdateUserRequest): Observable<User> {
    return this.api.put<User>(`/users/${id}`, request);
  }

  deleteUser(id: number): Observable<void> {
    return this.api.delete(`/users/${id}`);
  }
}
