import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { LogVisita } from '../models/log-visita';
import { LogVisitaService } from '../services/log-visita.service';

@Component({
  selector: 'app-log-visitas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzDescriptionsModule,
    NzInputModule,
    NzSelectModule,
    NzTableModule
  ],
  templateUrl: './log-visitas.component.html',
  styleUrl: './log-visitas.component.css'
})
export class LogVisitasComponent implements OnInit {
  visitas: LogVisita[] = [];
  cargando = false;
  terminoBusqueda = '';
  accionFiltro = 'todas';
  fechaDesde = '';
  fechaHasta = '';
  visitaSeleccionada: LogVisita | null = null;
  errorVisitas = '';

  constructor(
    private logVisitaService: LogVisitaService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.cargarVisitas();
  }

  get accionesDisponibles(): string[] {
    return Array.from(new Set(this.visitas.map(visita => visita.accion).filter(Boolean))).sort();
  }

  get visitasFiltradas(): LogVisita[] {
    const termino = this.normalizarTexto(this.terminoBusqueda);

    return this.visitas.filter(visita => {
      const coincideBusqueda = !termino || [
        visita.usuario?.NOMBRES,
        visita.usuario?.APELLIDOS,
        visita.usuario?.USU,
        visita.id_usuario,
        visita.ruta,
        visita.accion,
        visita.metodo,
        visita.ip,
        visita.user_agent
      ].some(valor => this.normalizarTexto(valor).includes(termino));

      const coincideAccion = this.accionFiltro === 'todas' || visita.accion === this.accionFiltro;
      const fechaVisita = this.obtenerFecha(visita.created_at);
      const desde = this.fechaDesde ? new Date(`${this.fechaDesde}T00:00:00`) : null;
      const hasta = this.fechaHasta ? new Date(`${this.fechaHasta}T23:59:59`) : null;
      const coincideDesde = !desde || (!!fechaVisita && fechaVisita >= desde);
      const coincideHasta = !hasta || (!!fechaVisita && fechaVisita <= hasta);

      return coincideBusqueda && coincideAccion && coincideDesde && coincideHasta;
    });
  }

  cargarVisitas(): void {
    this.cargando = true;
    this.errorVisitas = '';

    this.logVisitaService.obtenerVisitas().subscribe({
      next: (respuesta) => {
        this.visitas = this.normalizarRespuesta(respuesta);
        this.cargando = false;
      },
      error: () => {
        this.errorVisitas = 'No se pudo cargar el log de visitas.';
        this.message.error('Error al cargar el log de visitas');
        this.cargando = false;
      }
    });
  }

  limpiarFiltros(): void {
    this.terminoBusqueda = '';
    this.accionFiltro = 'todas';
    this.fechaDesde = '';
    this.fechaHasta = '';
  }

  seleccionarVisita(visita: LogVisita): void {
    this.visitaSeleccionada = visita;
  }

  obtenerNombreUsuario(visita: LogVisita): string {
    const nombres = [
      visita.usuario?.NOMBRES,
      visita.usuario?.APELLIDOS
    ].filter(Boolean).join(' ').trim();

    return nombres || visita.usuario?.USU || `Usuario ${visita.id_usuario}`;
  }

  formatearFecha(fecha: string): string {
    const fechaValida = this.obtenerFecha(fecha);
    return fechaValida ? fechaValida.toLocaleString('es-PE') : 'Sin fecha';
  }

  formatearDetalles(detalles: unknown): string {
    if (!detalles) {
      return 'Sin detalles registrados';
    }

    if (typeof detalles === 'string') {
      try {
        return JSON.stringify(JSON.parse(detalles), null, 2);
      } catch {
        return detalles;
      }
    }

    return JSON.stringify(detalles, null, 2);
  }

  private normalizarRespuesta(respuesta: any): LogVisita[] {
    const datos = Array.isArray(respuesta)
      ? respuesta
      : respuesta?.data ?? respuesta?.logs ?? respuesta?.visitas ?? [];

    return datos.map((visita: any) => ({
      ...visita,
      id: visita.id ?? visita.ID ?? 0,
      id_usuario: visita.id_usuario ?? visita.ID_USUARIO ?? visita.usuario?.id ?? 0,
      ruta: visita.ruta ?? '',
      accion: visita.accion ?? 'visita',
      metodo: visita.metodo ?? null,
      ip: visita.ip ?? null,
      user_agent: visita.user_agent ?? null,
      detalles: visita.detalles ?? null,
      created_at: visita.created_at ?? visita.fecha ?? ''
    }));
  }

  private obtenerFecha(fecha: string): Date | null {
    if (!fecha) {
      return null;
    }

    const fechaVisita = new Date(fecha);
    return Number.isNaN(fechaVisita.getTime()) ? null : fechaVisita;
  }

  private normalizarTexto(valor: unknown): string {
    return String(valor ?? '').trim().toLowerCase();
  }
}
