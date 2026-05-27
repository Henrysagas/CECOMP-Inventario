import { Injectable } from '@angular/core';
import { API_BASE_URL } from '../config/api.config';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ubicacion } from '../models/ubicacion';

@Injectable({
  providedIn: 'root'
})
export class UbicacionService {
  private apiUrl = `${API_BASE_URL}/ubicaciones`;

  constructor(private http: HttpClient) { }

 // Obtener todas las ubicaciones
  getUbicaciones(): Observable<Ubicacion[]> {
    return this.http.get<Ubicacion[]>(this.apiUrl);
  }
  // Obtener una ubicación específica
  getUbicacion(idUbicacion: number): Observable<Ubicacion> {
    return this.http.get<Ubicacion>(`${this.apiUrl}/${idUbicacion}`);
  }

    // Agregar nueva ubicación
    addUbicacion(ubicacion: Ubicacion): Observable<Ubicacion> {
      return this.http.post<Ubicacion>(this.apiUrl, ubicacion);
    }
    
  // Actualizar una ubicación existente
  updateUbicacion(idUbicacion: number, ubicacion: Ubicacion): Observable<Ubicacion> {
    return this.http.put<Ubicacion>(`${this.apiUrl}/${idUbicacion}`, ubicacion);
  }

  // Eliminar una ubicación
  eliminarUbicacion(idUbicacion: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idUbicacion}`);
  }
  getUbicacionesByDireccion(idDireccion: number): Observable<Ubicacion[]> {
    return this.http.get<Ubicacion[]>(`${this.apiUrl}/direccion/${idDireccion}`);
  }
}
