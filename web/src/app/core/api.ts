import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { GuideCard, Lead, User } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  sendLead(body: { name: string; phone: string; telegram: string; message: string }) {
    return this.http.post<{ ok: boolean }>('/api/leads', body);
  }

  guides() {
    return this.http.get<GuideCard[]>('/api/guides');
  }

  guide(slug: string) {
    return this.http.get<{ slug: string; markdown: string }>(`/api/guides/${slug}`);
  }

  adminUsers() {
    return this.http.get<User[]>('/api/admin/users');
  }

  createUser(body: { email: string; name: string; password: string; role: string; tourAccess: boolean }) {
    return this.http.post<User>('/api/admin/users', body);
  }

  patchUser(id: number, body: { tourAccess?: boolean; name?: string }) {
    return this.http.patch<User>(`/api/admin/users/${id}`, body);
  }

  adminLeads() {
    return this.http.get<Lead[]>('/api/admin/leads');
  }
}
