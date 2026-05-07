import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api/usuarios'; // Cambia esto si es necesario
  private token: string = ''; // Cambiar a string vacío
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.checkInitialLoginStatus());
  isLoggedIn$ = this.isLoggedInSubject.asObservable();
  
  // BehaviorSubject para el rol de administrador
private isAdminSubject = new BehaviorSubject<boolean>(this.checkInitialAdminStatus());
  isAdmin$ = this.isAdminSubject.asObservable(); 

  constructor(private http: HttpClient) {}

  // Verifica si hay un token almacenado y establece el estado inicial de inicio de sesión
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

  private checkInitialAdminStatus(): boolean {
    if (typeof window !== 'undefined') {
      const idRol = localStorage.getItem('ID_ROL');
      return idRol === '1'; // Assuming '1' is the admin role ID
    }
    return false;
  }


  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { USU: username, PASS: password }).pipe(
      tap(response => {
        this.token = response.token;  // Guarda el token
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', this.token);  // Guarda el token en localStorage
          localStorage.setItem('ID_ROL', response.user.ID_ROL.toString());  // Guarda el rol de usuario
          localStorage.setItem('id', response.user.id.toString()); // Este debería ser añadido
        }
        this.isLoggedInSubject.next(true);  // Actualiza el estado de sesión
        const isAdmin = response.user.ID_ROL === 1;  // Verifica si es admin
        this.isAdminSubject.next(isAdmin);  // Actualiza el estado del rol
      })
    );
  }
  
  
  
  // Método para registrar un nuevo usuario
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

  // Método para cerrar sesión
  logout(): void {
    this.token = ''; // Reinicia el token a string vacío
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    this.isLoggedInSubject.next(false);
    this.isAdminSubject.next(false); // Reinicia el estado de admin al cerrar sesión
  }

  // Método para obtener el token (si es necesario)
  getToken(): string {
    return this.token; // Siempre devuelve un string
  }

  
  getUserProfile(id: number): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('token')}`);
    return this.http.get(`${this.apiUrl}/${id}`, { headers });
  }
}
