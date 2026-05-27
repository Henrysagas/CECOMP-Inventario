import { Injectable } from '@angular/core';
import { API_BASE_URL } from '../config/api.config';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DireccionModel } from '../models/direccion.model';


@Injectable({
  providedIn: 'root'
})
export class DireccionesService {

  private apiUrl = `${API_BASE_URL}/direcciones`; // URL de la API

  constructor(private http: HttpClient) {}
  // Obtener todas las direcciones
  getDirecciones(): Observable<DireccionModel[]> {
    return this.http.get<DireccionModel[]>(this.apiUrl);
  }

  // Obtener una dirección por ID
  getDireccion(id: number): Observable<DireccionModel> {
    return this.http.get<DireccionModel>(`${this.apiUrl}/${id}`);
  }

  // Crear una nueva dirección
  addDireccion(direccion: DireccionModel): Observable<DireccionModel> {
    return this.http.post<DireccionModel>(this.apiUrl, direccion);
  }

  // Actualizar una dirección existente
  updateDireccion(id: number, direccion: DireccionModel): Observable<DireccionModel> {
    return this.http.put<DireccionModel>(`${this.apiUrl}/${id}`, direccion);
  }

  // Eliminar una dirección
  deleteDireccion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }


}
