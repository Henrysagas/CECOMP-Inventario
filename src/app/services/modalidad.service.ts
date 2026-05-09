import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Modalidad } from '../models/modalidad';
import { Bien } from '../models/bien';
import { BienModalidad } from '../models/bien-modalidad';

@Injectable({
  providedIn: 'root'
})
export class ModalidadService {
  private apiUrl = 'http://localhost:8000/api/modalidades'; // URL de tu API en Laravel

  constructor(private http: HttpClient) {}

  // Método para obtener todas las modalidades
  getModalidades(): Observable<Modalidad[]> {
    return this.http.get<Modalidad[]>(this.apiUrl);
  }

  // Método para crear una nueva modalidad (documento) con bienes seleccionados
  crearModalidad(modalidad: Modalidad): Observable<any> {
    return this.http.post(this.apiUrl, modalidad);
  }

  // Método para agregar bienes a una modalidad

  addBienes(modalidadId: number, bienes: Bien[], selectedAmbienteDestino: number, estados: { [key: number]: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${modalidadId}/bienes`, {
      bienes: bienes.map(bien => ({
        ID_BIEN: bien.id,
        estado: estados[bien.id] || 'Nuevo', // Usa el estado específico del bien o 'Nuevo' por defecto
        ID_AMBIENTE: selectedAmbienteDestino,
      }))
    });
  }
  
  addBienesBaja(modalidadId: number, bienes: Bien[], selectedAmbienteDestino: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${modalidadId}/bienes`, {
      bienes: bienes.map(bien => ({
        ID_BIEN: bien.id,
        estado: 'RAEE/Chatarra', // Cambia esto al estado real si lo tienes
        ID_AMBIENTE: selectedAmbienteDestino, // Asegúrate de pasar el ambiente destino
      }))
    });
  }

  getModalidadById(id: number): Observable<Modalidad> {
    return this.http.get<Modalidad>(`${this.apiUrl}/${id}`);
  }

  getBienesPorModalidad(id: number): Observable<BienModalidad[]> {
    return this.http.get<BienModalidad[]>(`${this.apiUrl}/${id}/bienes`);
  }
}
