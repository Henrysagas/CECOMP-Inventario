import { Injectable } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Ambiente } from '../models/ambiente';
import { Bien } from '../models/bien';
import { Categoria } from '../models/categoria';
import { Detalle } from '../models/detalle';
import { Historial } from '../models/historial';
import { Ubicacion } from '../models/ubicacion';
import { Usuario } from '../models/usuario';
import { AmbienteService } from './ambiente.service';
import { BienService } from './bien.service';
import { CategoriaService } from './categoria.service';
import { DetalleService } from './detalle.service';
import { UbicacionService } from './ubicacion.service';
import { UsuarioService } from './usuario.service';

export interface BienDetalleViewModel {
  bien: Bien;
  categorias: Categoria[];
  selectedCategoria: Categoria;
  ubicaciones: Ubicacion[];
  movimientos: Detalle[];
  usuariosAdministradores: Usuario[];
  historial: Historial[];
}

@Injectable({
  providedIn: 'root'
})
export class BienDetallePresenterService {
  constructor(
    private bienService: BienService,
    private categoriaService: CategoriaService,
    private ubicacionService: UbicacionService,
    private ambienteService: AmbienteService,
    private detalleService: DetalleService,
    private usuarioService: UsuarioService
  ) {}

  cargarVista(bienId: number): Observable<BienDetalleViewModel> {
    return this.bienService.getBien(bienId).pipe(
      map(data => this.mapBien(data)),
      switchMap(bien =>
        forkJoin({
          categorias: this.categoriaService.getCategorias(),
          ubicaciones: this.ubicacionService.getUbicaciones(),
          movimientos: this.cargarMovimientos(bien.id),
          usuariosAdministradores: this.usuarioService.getUsuariosConRolAdmin(),
          historial: this.bienService.getHistorialByBienId(bien.id)
        }).pipe(
          map(({ categorias, ubicaciones, movimientos, usuariosAdministradores, historial }) => {
            bien.movimientos = movimientos;

            return {
              bien,
              categorias,
              selectedCategoria: categorias.find(categoria => categoria.id === bien.categoria.id) || categorias[0],
              ubicaciones,
              movimientos,
              usuariosAdministradores,
              historial
            };
          })
        )
      )
    );
  }

  cargarMovimientos(bienId: number): Observable<Detalle[]> {
    return this.bienService.getMovimientosByBienId(bienId).pipe(
      map(movimientos => this.ordenarMovimientos(movimientos))
    );
  }

  cargarAmbientesPorUbicacion(ubicacionId: number): Observable<Ambiente[]> {
    return this.ambienteService.getAmbientesByUbicacion(ubicacionId);
  }

  agregarMovimiento(bien: Bien, ambienteId: number, estado: string): Observable<Detalle> {
    const fechaActual = new Date().toISOString();
    const movimiento = new Detalle(0, bien.id, ambienteId, estado, fechaActual, fechaActual, fechaActual);

    return this.detalleService.agregarMovimiento(bien.id, movimiento);
  }

  guardarCambios(bien: Bien, categoria: Categoria): Observable<Bien> {
    bien.categoria = categoria;
    bien.ID_CATEGORIA = categoria.id;

    return this.bienService.updateBien(bien);
  }

  ordenarMovimientos(movimientos: Detalle[]): Detalle[] {
    return [...movimientos].sort(
      (a, b) => new Date(b.FECHA_MODIFICACION).getTime() - new Date(a.FECHA_MODIFICACION).getTime()
    );
  }

  private mapBien(data: Bien): Bien {
    return new Bien(
      data.id,
      data.codigo,
      data.ID_CATEGORIA,
      data.ID_USUARIO,
      data.DESCRIPCION,
      data.FECHA_INGRESO,
      data.DIMENSION,
      data.MODELO,
      data.NUMERO_SERIE,
      data.TIPO,
      data.COLOR,
      new Categoria(data.categoria.id, data.categoria.NOMBRE_CATEGORIA),
      data.movimientos ? data.movimientos.map(movimiento => this.mapMovimiento(movimiento)) : [],
      data.usuario || ''
    );
  }

  private mapMovimiento(movimiento: Detalle): Detalle {
    return new Detalle(
      movimiento.id,
      movimiento.ID_BIEN,
      movimiento.ID_AMBIENTE,
      movimiento.ESTADO,
      movimiento.FECHA_MODIFICACION,
      movimiento.created_at,
      movimiento.updated_at,
      movimiento.ambiente
    );
  }
}
