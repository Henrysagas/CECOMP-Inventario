import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LogVisitaService {
  private apiUrl = 'http://localhost:8000/api/log-visitas';
  private ultimosRegistros = new Map<string, number>();

  constructor(private http: HttpClient) {}

  registrarVisita(ruta: string, accion = 'visita', detalles: Record<string, unknown> = {}): Observable<any> {
    return this.registrarAccion(accion, ruta, detalles);
  }

  registrarAccion(accion: string, ruta: string = this.obtenerRutaActual(), detalles: Record<string, unknown> = {}): Observable<any> {
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
          url: window.location.href,
          ...detalles
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

  registrarAccionLimitada(
    accion: string,
    ruta: string = this.obtenerRutaActual(),
    detalles: Record<string, unknown> = {},
    intervaloMs = 60000
  ): Observable<any> {
    const clave = `${accion}|${ruta}|${JSON.stringify(detalles)}`;
    const ahora = Date.now();
    const ultimoRegistro = this.ultimosRegistros.get(clave) || 0;

    if (ahora - ultimoRegistro < intervaloMs) {
      return of(null);
    }

    this.ultimosRegistros.set(clave, ahora);
    return this.registrarAccion(accion, ruta, detalles);
  }

  private obtenerRutaActual(): string {
    return typeof window !== 'undefined' ? window.location.pathname : '';
  }
}
