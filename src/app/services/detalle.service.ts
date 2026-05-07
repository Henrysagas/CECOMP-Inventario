import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Detalle } from '../models/detalle';

@Injectable({
  providedIn: 'root'
})
export class DetalleService {
  private apiUrl = 'http://localhost:8000/api/movimientos'; // Endpoint para movimientos

  constructor(private http: HttpClient) {}

  // Obtener todos los movimientos
  getMovimientos(): Observable<Detalle[]> {
    return this.http.get<Detalle[]>(this.apiUrl);
  }

  // Obtener movimientos por bien
  getMovimientosByBien(bienId: number): Observable<Detalle[]> {
    return this.http.get<Detalle[]>(`http://localhost:8000/api/bienes/${bienId}/movimientos`);
  }

  agregarMovimiento(id: number, nuevoMovimiento: Detalle): Observable<Detalle> {
    return this.http.post<Detalle>(`http://localhost:8000/api/bienes/${id}/movimientos`, nuevoMovimiento);
  }

  // Otros métodos para actualizar y eliminar movimientos si es necesario
}
