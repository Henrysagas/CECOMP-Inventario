import { Injectable } from '@angular/core';
import { API_BASE_URL } from '../config/api.config';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RolUsuario } from '../models/rol-usuario';

@Injectable({
  providedIn: 'root'
})
export class RolUsuarioService {
  private apiUrl = `${API_BASE_URL}/roles-usuarios`;

  constructor(private http: HttpClient) { }

  getRoles(): Observable<RolUsuario[]> {
    return this.http.get<RolUsuario[]>(this.apiUrl);
  }
}
