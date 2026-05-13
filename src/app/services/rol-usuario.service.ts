import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RolUsuario } from '../models/rol-usuario';

@Injectable({
  providedIn: 'root'
})
export class RolUsuarioService {
  private apiUrl = 'http://localhost:8000/api/roles-usuarios';

  constructor(private http: HttpClient) { }

  getRoles(): Observable<RolUsuario[]> {
    return this.http.get<RolUsuario[]>(this.apiUrl);
  }
}
