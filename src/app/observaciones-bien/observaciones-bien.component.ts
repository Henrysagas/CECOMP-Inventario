import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { ObservacionBien, ObservacionBienPayload } from '../models/observacion-bien';
import { ObservacionBienService } from '../services/observacion-bien.service';

@Component({
  selector: 'app-observaciones-bien',
  standalone: true,
  imports: [CommonModule, FormsModule, NzMessageModule, NzModalModule],
  templateUrl: './observaciones-bien.component.html',
  styleUrls: ['./observaciones-bien.component.css']
})
export class ObservacionesBienComponent implements OnInit, OnChanges {
  @Input() bienId: number | null = null;
  @Input() titulo = 'Observaciones de Bienes';
  @Input() mostrarFiltroBien = true;
  @Input() permitirGestion = true;

  observaciones: ObservacionBien[] = [];
  cargando = false;
  error = '';
  filtroBien = '';
  filtroTipo = '';
  paginaActual = 1;
  tamanioPagina = 5;
  mostrarFormulario = false;
  guardando = false;
  observacionEditandoId: number | null = null;

  formulario: ObservacionBienPayload = this.crearFormularioVacio();

  constructor(
    private observacionService: ObservacionBienService,
    private route: ActivatedRoute,
    private message: NzMessageService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    const bienQuery = this.route.snapshot.queryParamMap.get('ID_BIEN');
    const tipoQuery = this.route.snapshot.queryParamMap.get('tipo_evento');

    if (!this.bienId && bienQuery) {
      this.filtroBien = bienQuery;
    }

    this.filtroTipo = tipoQuery || '';
    this.prepararFormularioInicial();
    this.cargarObservaciones();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bienId'] && !changes['bienId'].firstChange) {
      this.prepararFormularioInicial();
      this.cargarObservaciones();
    }
  }

  cargarObservaciones(): void {
    this.cargando = true;
    this.error = '';

    this.observacionService.getObservaciones({
      ID_BIEN: this.bienId || this.filtroBien,
      tipo_evento: this.filtroTipo
    }).subscribe({
      next: observaciones => {
        this.observaciones = [...observaciones].sort((a, b) => this.obtenerTiempo(b) - this.obtenerTiempo(a));
        this.ajustarPagina();
        this.cargando = false;
      },
      error: error => {
        console.error('Error al cargar observaciones:', error);
        this.error = 'No se pudieron cargar las observaciones.';
        this.cargando = false;
      }
    });
  }

  buscar(): void {
    this.paginaActual = 1;
    this.cargarObservaciones();
  }

  limpiarFiltros(): void {
    this.filtroBien = '';
    this.filtroTipo = '';
    this.buscar();
  }

  mostrarNuevaObservacion(): void {
    if (!this.permitirGestion) {
      return;
    }

    this.observacionEditandoId = null;
    this.formulario = this.crearFormularioVacio();
    this.mostrarFormulario = true;
  }

  editarObservacion(observacion: ObservacionBien): void {
    if (!this.permitirGestion) {
      return;
    }

    this.observacionEditandoId = observacion.id;
    this.formulario = {
      ID_BIEN: observacion.ID_BIEN,
      tipo_evento: observacion.tipo_evento,
      observacion: observacion.observacion || '',
      fecha_evento: this.normalizarFechaParaInput(observacion.fecha_evento),
      id_usuario: observacion.id_usuario || this.obtenerUsuarioActualId()
    };
    this.mostrarFormulario = true;
  }

  cancelarFormulario(): void {
    this.mostrarFormulario = false;
    this.observacionEditandoId = null;
    this.formulario = this.crearFormularioVacio();
  }

  guardarObservacion(): void {
    if (!this.permitirGestion) {
      return;
    }

    if (!this.formulario.ID_BIEN || !this.formulario.tipo_evento?.trim()) {
      this.message.warning('Completa el bien y el tipo de evento.');
      return;
    }

    this.guardando = true;
    const payload = this.limpiarPayload(this.formulario);
    const request = this.observacionEditandoId
      ? this.observacionService.updateObservacion(this.observacionEditandoId, payload)
      : this.observacionService.createObservacion(payload);

    request.subscribe({
      next: () => {
        this.message.success(this.observacionEditandoId ? 'Observacion actualizada correctamente.' : 'Observacion registrada correctamente.');
        this.guardando = false;
        this.cancelarFormulario();
        this.cargarObservaciones();
      },
      error: error => {
        console.error('Error al guardar observacion:', error);
        this.message.error('No se pudo guardar la observacion.');
        this.guardando = false;
      }
    });
  }

  confirmarEliminar(observacion: ObservacionBien): void {
    if (!this.permitirGestion) {
      return;
    }

    this.modal.confirm({
      nzTitle: 'Eliminar observacion',
      nzContent: 'Esta accion eliminara la observacion del bien. Deseas continuar?',
      nzOkText: 'Eliminar',
      nzOkDanger: true,
      nzCancelText: 'Cancelar',
      nzOnOk: () => this.eliminarObservacion(observacion.id)
    });
  }

  get observacionesPaginadas(): ObservacionBien[] {
    const inicio = (this.paginaActual - 1) * this.tamanioPagina;
    return this.observaciones.slice(inicio, inicio + this.tamanioPagina);
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.observaciones.length / this.tamanioPagina));
  }

  get indiceInicio(): number {
    return this.observaciones.length === 0 ? 0 : (this.paginaActual - 1) * this.tamanioPagina + 1;
  }

  get indiceFin(): number {
    return Math.min(this.paginaActual * this.tamanioPagina, this.observaciones.length);
  }

  irPaginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
    }
  }

  irPaginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
    }
  }

  obtenerNombreBien(observacion: ObservacionBien): string {
    const bien = observacion.bien as any;
    return bien?.codigo ? String(bien.codigo) : String(observacion.ID_BIEN);
  }

  obtenerNombreUsuario(observacion: ObservacionBien): string {
    const usuario = observacion.usuario;
    if (!usuario) {
      return observacion.id_usuario ? `Usuario ${observacion.id_usuario}` : 'Sin usuario';
    }

    const nombre = [usuario.NOMBRES, usuario.APELLIDOS].filter(Boolean).join(' ').trim();
    return nombre || usuario.USU || `Usuario ${observacion.id_usuario}`;
  }

  private eliminarObservacion(id: number): void {
    this.observacionService.deleteObservacion(id).subscribe({
      next: () => {
        this.message.success('Observacion eliminada correctamente.');
        this.observaciones = this.observaciones.filter(observacion => observacion.id !== id);
        this.ajustarPagina();
      },
      error: error => {
        console.error('Error al eliminar observacion:', error);
        this.message.error('No se pudo eliminar la observacion.');
      }
    });
  }

  private crearFormularioVacio(): ObservacionBienPayload {
    return {
      ID_BIEN: this.bienId || Number(this.filtroBien) || 0,
      tipo_evento: '',
      observacion: '',
      fecha_evento: '',
      id_usuario: this.obtenerUsuarioActualId()
    };
  }

  private prepararFormularioInicial(): void {
    this.formulario = this.crearFormularioVacio();
  }

  private obtenerUsuarioActualId(): number | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const usuarioId = Number(localStorage.getItem('id'));
    return Number.isNaN(usuarioId) ? null : usuarioId;
  }

  private limpiarPayload(payload: ObservacionBienPayload): ObservacionBienPayload {
    const limpio: ObservacionBienPayload = {
      ID_BIEN: Number(payload.ID_BIEN),
      tipo_evento: payload.tipo_evento.trim()
    };

    if (payload.observacion?.trim()) {
      limpio.observacion = payload.observacion.trim();
    }

    if (payload.fecha_evento) {
      limpio.fecha_evento = payload.fecha_evento;
    }

    if (payload.id_usuario) {
      limpio.id_usuario = Number(payload.id_usuario);
    }

    return limpio;
  }

  private normalizarFechaParaInput(fecha?: string | null): string {
    return fecha ? fecha.substring(0, 10) : '';
  }

  private obtenerTiempo(observacion: ObservacionBien): number {
    return new Date(observacion.fecha_evento || observacion.created_at || '').getTime() || 0;
  }

  private ajustarPagina(): void {
    this.paginaActual = Math.min(Math.max(this.paginaActual, 1), this.totalPaginas);
  }
}
