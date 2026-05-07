import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Bien } from '../models/bien';
import { Detalle } from '../models/detalle';
import { Historial } from '../models/historial';

@Injectable({
  providedIn: 'root'
})
export class BienService {


  private apiUrl = 'http://localhost:8000/api/bienes';
  private movimientosUrl = 'http://localhost:8000/api/movimientos'; // Endpoint para movimientos
 
  getBienesFueraInventario(): Observable<Bien[]> {
    return this.http.get<Bien[]>(`http://localhost:8000/api/bienesfuera`);
  }
  constructor(private http: HttpClient) {}

  getBienes(): Observable<Bien[]> {
    return this.http.get<Bien[]>(this.apiUrl);
  }
  
  getBienPorAmbiente(idAmbiente: number, fecha?: string): Observable<Bien[]> {
    const url = fecha ? `${this.apiUrl}/ambiente/${idAmbiente}/${fecha}` : `${this.apiUrl}/ambiente/${idAmbiente}`;
    return this.http.get<Bien[]>(url);
  }
  
  
  


  getBien(id: number): Observable<Bien> {
    return this.http.get<Bien>(`${this.apiUrl}/${id}`);
  }

  getMovimientosByBienId(bienId: number): Observable<Detalle[]> {
    return this.http.get<Detalle[]>(`${this.apiUrl}/${bienId}/movimientos`);
  }

  createBien(bien: Bien): Observable<Bien> {
    return this.http.post<Bien>(this.apiUrl, bien);
  }

  updateBien(bien: Partial<Bien> & { id: number }): Observable<Bien> {
    return this.http.put<Bien>(`${this.apiUrl}/${bien.id}`, bien);
  }

  eliminarBien(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  agregarMovimiento(bienId: number, nuevoMovimiento: Detalle): Observable<Detalle> {
    return this.http.post<Detalle>(`${this.apiUrl}/${bienId}/movimientos`, nuevoMovimiento);
  }
  
  createBienConMovimiento(nuevoBien: Bien, movimiento: { ID_AMBIENTE: number, ESTADO: string }): Observable<any> {
    const body = {
      ID: nuevoBien.id,  // Asegúrate de que 'ID' esté presente y correctamente enviado
      codigo: nuevoBien.codigo,  // Se añade el campo 'codigo'
      ID_CATEGORIA: nuevoBien.ID_CATEGORIA,
      ID_USUARIO: nuevoBien.ID_USUARIO,
      DESCRIPCION: nuevoBien.DESCRIPCION,
      FECHA_INGRESO: nuevoBien.FECHA_INGRESO || new Date().toISOString(),  // Si la fecha no está, asigna la actual
      DIMENSION: nuevoBien.DIMENSION,
      MODELO: nuevoBien.MODELO,
      NUMERO_SERIE: nuevoBien.NUMERO_SERIE,
      TIPO: nuevoBien.TIPO,
      COLOR: nuevoBien.COLOR,
      ID_AMBIENTE: movimiento.ID_AMBIENTE,
      ESTADO: movimiento.ESTADO
    };
  
    console.log('Cuerpo a enviar:', body);  // Para verificar que el ID esté presente en el cuerpo
  
    return this.http.post<any>(this.apiUrl, body);
  }
  getHistorialByBienId(bienId: number): Observable<Historial[]> {
    return this.http.get<Historial[]>(`${this.apiUrl}/${bienId}/historial`);
  }

}
