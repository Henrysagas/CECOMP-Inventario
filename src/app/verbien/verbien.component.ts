import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BienService } from '../services/bien.service';
import { Bien } from '../models/bien';
import { Categoria } from '../models/categoria';
import { Detalle } from '../models/detalle';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTableModule } from 'ng-zorro-antd/table'; // Asegúrate de importar esto
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzTableComponent } from 'ng-zorro-antd/table';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { Historial } from '../models/historial';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzCardComponent } from "ng-zorro-antd/card";
import { Location } from '@angular/common';
import { ObservacionesBienComponent } from '../observaciones-bien/observaciones-bien.component';

@Component({
  selector: 'app-ver-bien',
  standalone: true,
  templateUrl: './verbien.component.html',
  styleUrls: ['./verbien.component.css'],
  // Asegúrate de importar todos los módulos que uses en el HTML
  imports: [FormsModule,
    CommonModule,
    NzGridModule,
    NzTableModule,
    NzSelectModule,
    NzDescriptionsModule,
    NzTabsModule,
    NzTableComponent,
    NzTimelineModule,
    NzCardComponent,
    ObservacionesBienComponent,
    RouterModule],
  template: `
  <div nz-row>
  <div nz-col nzSpan="12">col-12</div>
  <div nz-col nzSpan="12">col-12</div>
  </div>  `,
})
export class VerBienComponent implements OnInit {
  bien!: Bien;
  movimientos: Detalle[] = [];
  historial: Historial[] = [];
  paginaMovimientos = 1;
  tamanioPaginaMovimientos = 5;
  paginaResponsables = 1;
  tamanioPaginaResponsables = 5;

  constructor(
    private bienService: BienService,
    private route: ActivatedRoute,
    private location: Location
  ) {}

  ngOnInit(): void {
    const bienId = +this.route.snapshot.paramMap.get('id')!;

    // Obtener el bien específico
    this.bienService.getBien(bienId).subscribe((data: any) => {
      this.bien = new Bien(
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
        data.movimientos ? data.movimientos.map((mov: any) => new Detalle(
          mov.id,
          mov.ID_BIEN,
          mov.ID_AMBIENTE,
          mov.ESTADO,
          mov.FECHA_MODIFICACION,
          mov.created_at,
          mov.updated_at
        )) : [],
        this.obtenerNombreUsuario(data.usuario)
      );

      // Cargar movimientos del bien
      this.cargarMovimientos(bienId);
      this.cargarHistorial(bienId);

    });
  }

  cargarMovimientos(bienId: number): void {
    this.bienService.getMovimientosByBienId(bienId).subscribe(
      (movimientos: Detalle[]) => {
        this.movimientos = movimientos.sort((a, b) => new Date(b.FECHA_MODIFICACION).getTime() - new Date(a.FECHA_MODIFICACION).getTime());
        this.ajustarPaginaMovimientos();
      },
      error => {
        console.error('Error al cargar movimientos:', error);
      }
    );
  }
  cargarHistorial(bienId: number): void {
    this.bienService.getHistorialByBienId(bienId).subscribe(
      (historial: Historial[]) => {
        this.historial = historial.sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime());
        this.ajustarPaginaResponsables();
      },
      error => {
        console.error('Error al cargar el historial:', error);
      }
    );
  }

  get movimientosPaginados(): Detalle[] {
    const inicio = (this.paginaMovimientos - 1) * this.tamanioPaginaMovimientos;
    return this.movimientos.slice(inicio, inicio + this.tamanioPaginaMovimientos);
  }

  get totalPaginasMovimientos(): number {
    return Math.max(1, Math.ceil(this.movimientos.length / this.tamanioPaginaMovimientos));
  }

  get inicioMovimientos(): number {
    return this.movimientos.length === 0 ? 0 : (this.paginaMovimientos - 1) * this.tamanioPaginaMovimientos + 1;
  }

  get finMovimientos(): number {
    return Math.min(this.paginaMovimientos * this.tamanioPaginaMovimientos, this.movimientos.length);
  }

  get historialOrdenado(): Historial[] {
    return [...this.historial].sort((a, b) => {
      if (a.vigente && !b.vigente) {
        return -1;
      }

      if (!a.vigente && b.vigente) {
        return 1;
      }

      return new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime();
    });
  }

  get responsablesPaginados(): Historial[] {
    const inicio = (this.paginaResponsables - 1) * this.tamanioPaginaResponsables;
    return this.historialOrdenado.slice(inicio, inicio + this.tamanioPaginaResponsables);
  }

  get totalPaginasResponsables(): number {
    return Math.max(1, Math.ceil(this.historialOrdenado.length / this.tamanioPaginaResponsables));
  }

  get inicioResponsables(): number {
    return this.historialOrdenado.length === 0 ? 0 : (this.paginaResponsables - 1) * this.tamanioPaginaResponsables + 1;
  }

  get finResponsables(): number {
    return Math.min(this.paginaResponsables * this.tamanioPaginaResponsables, this.historialOrdenado.length);
  }

  get responsableActualNombre(): string {
    const responsableActual = this.historialOrdenado.find(item => item.vigente);
    return responsableActual ? this.obtenerNombreResponsable(responsableActual) : this.obtenerNombreUsuario(this.bien?.usuario);
  }

  irPaginaMovimientosAnterior(): void {
    if (this.paginaMovimientos > 1) {
      this.paginaMovimientos--;
    }
  }

  irPaginaMovimientosSiguiente(): void {
    if (this.paginaMovimientos < this.totalPaginasMovimientos) {
      this.paginaMovimientos++;
    }
  }

  irPaginaResponsablesAnterior(): void {
    if (this.paginaResponsables > 1) {
      this.paginaResponsables--;
    }
  }

  irPaginaResponsablesSiguiente(): void {
    if (this.paginaResponsables < this.totalPaginasResponsables) {
      this.paginaResponsables++;
    }
  }

  obtenerNombreResponsable(item: Historial): string {
    return this.obtenerNombreUsuario(item.usuario);
  }

  obtenerEstadoResponsable(item: Historial): string {
    const inicio = this.obtenerTiempoFecha(item.fecha_inicio);
    const fin = item.fecha_fin ? this.obtenerTiempoFinDia(item.fecha_fin) : Number.POSITIVE_INFINITY;
    const movimientosOrdenados = [...this.movimientos].sort(
      (a, b) => new Date(b.FECHA_MODIFICACION).getTime() - new Date(a.FECHA_MODIFICACION).getTime()
    );

    const movimientoEnPeriodo = movimientosOrdenados.find(movimiento => {
      const fechaMovimiento = this.obtenerTiempoFecha(movimiento.FECHA_MODIFICACION);
      return fechaMovimiento >= inicio && fechaMovimiento <= fin;
    });

    if (movimientoEnPeriodo?.ESTADO) {
      return movimientoEnPeriodo.ESTADO;
    }

    const movimientoVigenteAlInicio = movimientosOrdenados.find(movimiento =>
      this.obtenerTiempoFecha(movimiento.FECHA_MODIFICACION) <= inicio
    );

    return movimientoVigenteAlInicio?.ESTADO || 'Sin estado';
  }

  obtenerNombreUsuario(usuario: unknown): string {
    if (!usuario) {
      return 'Sin responsable';
    }

    if (typeof usuario === 'string') {
      return usuario || 'Sin responsable';
    }

    const usuarioData = usuario as { NOMBRES?: string; APELLIDOS?: string; USU?: string; name?: string; nombre?: string };
    const nombreCompleto = [usuarioData.NOMBRES, usuarioData.APELLIDOS].filter(Boolean).join(' ').trim();

    return nombreCompleto || usuarioData.USU || usuarioData.name || usuarioData.nombre || 'Sin responsable';
  }

  volver(): void {
    this.location.back();
  }

  private ajustarPaginaMovimientos(): void {
    this.paginaMovimientos = Math.min(Math.max(this.paginaMovimientos, 1), this.totalPaginasMovimientos);
  }

  private ajustarPaginaResponsables(): void {
    this.paginaResponsables = Math.min(Math.max(this.paginaResponsables, 1), this.totalPaginasResponsables);
  }

  private obtenerTiempoFecha(fecha?: string | null): number {
    return new Date(fecha || '').getTime() || 0;
  }

  private obtenerTiempoFinDia(fecha: string): number {
    if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return new Date(`${fecha}T23:59:59`).getTime();
    }

    return this.obtenerTiempoFecha(fecha);
  }
}
