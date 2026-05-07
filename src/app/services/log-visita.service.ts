import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LogVisitaService {
  private apiUrl = 'http://localhost:8000/api/log-visitas';

  constructor(private http: HttpClient) {}

  registrarVisita(ruta: string, accion = 'visita'): Observable<any> {
    if (typeof window === 'undefined') {
      return of(null);
    }

    const idUsuario = localStorage.getItem('id');

    if (!idUsuario) {
      return of(null);
    }

    return this.http
      .post(this.apiUrl, {
        id_usuario: Number(idUsuario),
        ruta,
        accion,
        detalles: {
          titulo: document.title,
          url: window.location.href
        }
      })
      .pipe(
        catchError((error) => {
          console.error('Error al registrar visita:', error);
          return of(null);
        })
      );
  }

  obtenerVisitas(params: Record<string, string | number> = {}): Observable<any> {
    return this.http.get(this.apiUrl, { params: params as any });
  }
}
