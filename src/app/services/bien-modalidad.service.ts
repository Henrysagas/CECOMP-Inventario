import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Modalidad } from '../models/modalidad';
import { Bien } from '../models/bien';
import { BienModalidad  } from '../models/bien-modalidad';

@Injectable({
  providedIn: 'root'
})
export class BienModalidadService {
  private apiUrl = 'http://localhost:8000/api/modalidades'; // URL de tu API en Laravel

  constructor(private http: HttpClient) {}

  // Método para obtener todas las modalidades
  getModalidades(): Observable<Modalidad[]> {
    return this.http.get<Modalidad[]>(`${this.apiUrl}`);
  }

  // Método para crear una nueva modalidad (documento) con bienes seleccionados
  crearModalidadConBienes(modalidad: Modalidad, bienesSeleccionados: Bien[]): Observable<Modalidad> {
    const payload = {
      modalidad,
      bienes: bienesSeleccionados // Enviar modalidad y bienes al backend
    };

    return this.http.post<Modalidad>(`${this.apiUrl}/crear-con-bienes`, payload);  // Asumiendo que tienes una ruta para crear modalidad con bienes
  }
  getBienesPorModalidad(idModalidad: number): Observable<BienModalidad[]> {
    return this.http.get<BienModalidad[]>(`${this.apiUrl}/${idModalidad}/bienes`);
  }
}
