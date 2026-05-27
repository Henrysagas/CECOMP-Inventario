import { Injectable } from '@angular/core';
import { API_BASE_URL } from '../config/api.config';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Detalle } from '../models/detalle';

@Injectable({
  providedIn: 'root'
})
export class DetalleService {
  private apiUrl = `${API_BASE_URL}/movimientos`; // Endpoint para movimientos

  constructor(private http: HttpClient) {}

  // Obtener todos los movimientos
  getMovimientos(): Observable<Detalle[]> {
    return this.http.get<Detalle[]>(this.apiUrl);
  }

  // Obtener movimientos por bien
  getMovimientosByBien(bienId: number): Observable<Detalle[]> {
    return this.http.get<Detalle[]>(`${API_BASE_URL}/bienes/${bienId}/movimientos`);
  }

  agregarMovimiento(id: number, nuevoMovimiento: Detalle): Observable<Detalle> {
    return this.http.post<Detalle>(`${API_BASE_URL}/bienes/${id}/movimientos`, nuevoMovimiento);
  }

  // Otros métodos para actualizar y eliminar movimientos si es necesario
}
