import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Usuario } from '../models/usuario';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private apiUrl = 'http://localhost:8000/api/usuarios'; // URL de tu API

  constructor(private http: HttpClient) {}
  
  getBienesPorUsuario(idUsuario: number): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8000/api/bienes?usuario=${idUsuario}`);
  }
  
  // Método para obtener usuarios con rol de administrador
  getUsuariosConRolAdmin(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/admins`);
  }

  getUsuariosAsignablesBienes(): Observable<Usuario[]> {
    return this.getUsuariosConRolAdmin().pipe(
      map(usuarios => usuarios.filter(usuario => !this.esUsuarioPatrimonio(usuario)))
    );
  }

  esUsuarioSinUsuario(usuario: Usuario): boolean {
    return this.obtenerTextoUsuario(usuario) === 'sin usuario';
  }

  esUsuarioPatrimonio(usuario: Usuario): boolean {
    return this.obtenerTextoUsuario(usuario) === 'patrimonio';
  }

  // Método para obtener todos los usuarios
  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  // Método para eliminar un usuario
  deleteUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
  getUsuarioInfo() {
    const token = localStorage.getItem('token');

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get(`${this.apiUrl}/me`, { headers });
  }
  
  // Método para actualizar el rol de un usuario
  updateRol(id: number, rolId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/rol`, { ID_ROL: rolId });
  }
  updatePassword(data: { oldPassword: string; newPassword: string }): Observable<any> {
    const userId = localStorage.getItem('id');  // Obtener el ID del usuario de localStorage (si lo tienes guardado)
  
    if (!userId) {
      throw new Error('No user ID found!');
    }
  
    return this.http.put(`${this.apiUrl}/${userId}/password`, data);
  }
  getUserProfile(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  updateUsuario(id: number, usuario: Partial<Usuario>): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}`, usuario);
  }

  private obtenerTextoUsuario(usuario: Usuario): string {
    return [
      usuario.NOMBRES,
      usuario.APELLIDOS,
      usuario.USU
    ]
      .filter(Boolean)
      .join(' ')
      .trim()
      .toLowerCase();
  }
  
}
