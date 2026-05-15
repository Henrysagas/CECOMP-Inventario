import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ObservacionBien,
  ObservacionBienFilters,
  ObservacionBienPayload
} from '../models/observacion-bien';

@Injectable({
  providedIn: 'root'
})
export class ObservacionBienService {
  private apiUrl = 'http://localhost:8000/api/observaciones';

  constructor(private http: HttpClient) {}

  getObservaciones(filters: ObservacionBienFilters = {}): Observable<ObservacionBien[]> {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<ObservacionBien[]>(this.apiUrl, { params });
  }

  getObservacion(id: number): Observable<ObservacionBien> {
    return this.http.get<ObservacionBien>(`${this.apiUrl}/${id}`);
  }

  createObservacion(payload: ObservacionBienPayload): Observable<ObservacionBien> {
    return this.http.post<ObservacionBien>(this.apiUrl, payload);
  }

  updateObservacion(id: number, payload: Partial<ObservacionBienPayload>): Observable<ObservacionBien> {
    return this.http.put<ObservacionBien>(`${this.apiUrl}/${id}`, payload);
  }

  patchObservacion(id: number, payload: Partial<ObservacionBienPayload>): Observable<ObservacionBien> {
    return this.http.patch<ObservacionBien>(`${this.apiUrl}/${id}`, payload);
  }

  deleteObservacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
