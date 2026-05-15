import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  static readonly ROLE_ADMIN = 1;
  static readonly ROLE_USER = 2;
  static readonly ROLE_SUPER_ADMIN = 3;

  private apiUrl = 'http://localhost:8000/api/usuarios';
  private token: string = '';
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.checkInitialLoginStatus());
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  private currentRoleSubject = new BehaviorSubject<number | null>(this.getStoredRole());
  currentRole$ = this.currentRoleSubject.asObservable();

  private isAdminSubject = new BehaviorSubject<boolean>(this.canManageInventory(this.getStoredRole()));
  isAdmin$ = this.isAdminSubject.asObservable();

  constructor(private http: HttpClient) {}

  private checkInitialLoginStatus(): boolean {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        this.token = token;
        return true;
      }
    }
    return false;
  }

  getStoredRole(): number | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const idRol = Number(localStorage.getItem('ID_ROL'));
    return Number.isNaN(idRol) ? null : idRol;
  }

  isSuperAdmin(role: number | null = this.getStoredRole()): boolean {
    return role === AuthService.ROLE_SUPER_ADMIN;
  }

  canManageInventory(role: number | null = this.getStoredRole()): boolean {
    return role === AuthService.ROLE_ADMIN || role === AuthService.ROLE_SUPER_ADMIN;
  }

  canManageUsers(role: number | null = this.getStoredRole()): boolean {
    return role === AuthService.ROLE_SUPER_ADMIN;
  }

  canGenerateTransferReports(role: number | null = this.getStoredRole()): boolean {
    return this.canManageInventory(role);
  }

  private syncRole(role: number | null): void {
    this.currentRoleSubject.next(role);
    this.isAdminSubject.next(this.canManageInventory(role));
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { USU: username, PASS: password }).pipe(
      tap(response => {
        this.token = response.token;
        const role = Number(response.user.ID_ROL);
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', this.token);
          localStorage.setItem('ID_ROL', String(role));
          localStorage.setItem('id', response.user.id.toString());
        }
        this.isLoggedInSubject.next(true);
        this.syncRole(role);
      })
    );
  }

  register(nombres: string, apellidos: string, username: string, dni: string, estado: string, cargo: string, password: string, idRol: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, {
      NOMBRES: nombres,
      APELLIDOS: apellidos,
      USU: username,
      dni: dni,
      estado: estado,
      cargo: cargo,
      PASS: password,
      ID_ROL: idRol
    });
  }

  getCurrentUser(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me`, {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
  }

  logout(): void {
    this.token = '';
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('ID_ROL');
      localStorage.removeItem('id');
    }
    this.isLoggedInSubject.next(false);
    this.syncRole(null);
  }

  getToken(): string {
    return this.token;
  }

  getUserProfile(id: number): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('token')}`);
    return this.http.get(`${this.apiUrl}/${id}`, { headers });
  }
}
