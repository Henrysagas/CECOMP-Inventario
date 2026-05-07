import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ambiente } from '../models/ambiente';

@Injectable({
  providedIn: 'root'
})
export class AmbienteService {
  private apiUrl = 'http://localhost:8000/api/ubicaciones';

  constructor(private http: HttpClient) { }

  // Obtener todos los ambientes
  getAmbientes(): Observable<Ambiente[]> {
    return this.http.get<Ambiente[]>(this.apiUrl);
  }

// Obtener un ambiente específico
getAmbiente(idAmbiente: number): Observable<Ambiente> {
  return this.http.get<Ambiente>(`http://localhost:8000/api/ambientes/${idAmbiente}`); // Cambiado para apuntar a la URL correcta
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
  updateAmbiente(idAmbiente: number, ambiente: Ambiente): Observable<Ambiente> {
    return this.http.put<Ambiente>(`${this.apiUrl}/${idAmbiente}`, ambiente);
  }

  // Eliminar un ambiente
  eliminarAmbiente(idAmbiente: number): Observable<void> {
    return this.http.delete<void>(`http://localhost:8000/api/ambientes/${idAmbiente}`);
  }
}
