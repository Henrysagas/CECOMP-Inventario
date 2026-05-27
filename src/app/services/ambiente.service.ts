import { Injectable } from '@angular/core';
import { API_BASE_URL } from '../config/api.config';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ambiente } from '../models/ambiente';

@Injectable({
  providedIn: 'root'
})
export class AmbienteService {
  private apiUrl = `${API_BASE_URL}/ubicaciones`;

  constructor(private http: HttpClient) { }

  // Obtener todos los ambientes
  getAmbientes(): Observable<Ambiente[]> {
    return this.http.get<Ambiente[]>(`${API_BASE_URL}/ambientes`);
  }

// Obtener un ambiente específico
getAmbiente(idAmbiente: number): Observable<Ambiente> {
  return this.http.get<Ambiente>(`${API_BASE_URL}/ambientes/${idAmbiente}`); // Cambiado para apuntar a la URL correcta
}


  getAmbientesByUbicacion(ubicacionId: number): Observable<Ambiente[]> {
    return this.http.get<Ambiente[]>(`${this.apiUrl}/${ubicacionId}/ambientes`);
  }

  // Agregar nuevo ambiente
  addAmbiente(ubicacionId: number, ambiente: Ambiente): Observable<Ambiente> {
    console.log('Ambiente que se va a agregar:', ambiente);
    return this.http.post<Ambiente>(`${this.apiUrl}/${ubicacionId}/ambientes`, ambiente);
  }
  

  // Actualizar un ambiente existente
  updateAmbiente(idAmbiente: number, ambiente: Partial<Ambiente> & { nombre?: string }): Observable<Ambiente> {
    return this.http.put<Ambiente>(`${API_BASE_URL}/ambientes/${idAmbiente}`, ambiente);
  }

  // Eliminar un ambiente
  eliminarAmbiente(idAmbiente: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/ambientes/${idAmbiente}`);
  }
}
