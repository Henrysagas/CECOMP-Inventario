import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableComponent, NzTableModule } from 'ng-zorro-antd/table';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { Ambiente } from '../../models/ambiente';
import { Bien } from '../../models/bien';
import { Categoria } from '../../models/categoria';
import { Detalle } from '../../models/detalle';
import { Historial } from '../../models/historial';
import { Ubicacion } from '../../models/ubicacion';
import { Usuario } from '../../models/usuario';
import { BienDetallePresenterService } from '../../services/bien-detalle-presenter.service';
import { LogVisitaService } from '../../services/log-visita.service';

@Component({
  selector: 'app-historial-responsables',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    NzGridModule,
    NzTableModule,
    NzSelectModule,
    NzDescriptionsModule,
    NzTableComponent,
    NzTimelineModule,
    NzMessageModule,
    RouterModule
  ],
  templateUrl: './historial-responsables.component.html',
  styleUrl: './historial-responsables.component.css'
})
export class HistorialResponsablesComponent implements OnInit {
  bien!: Bien;
  categorias: Categoria[] = [];
  selectedCategoria!: Categoria;
  showAgregarMovimiento = false;
  showAmbienteSelect = false;
  ubicaciones: Ubicacion[] = [];
  ambientes: Ambiente[] = [];
  selectedUbicacionId: number | null = null;
  selectedAmbienteId: number | null = null;
  selectedEstado = '';
  isEditing = false;
  estados = ['Nuevo', 'Bueno', 'Regular', 'Deficiente', 'Malo'];
  movimientos: Detalle[] = [];
  isLoading = false;
  usuariosAdministradores: Usuario[] = [];
  historial: Historial[] = [];
  showCambiarResponsable = false;
  selectedUsuarioId: number | null = null;
  paginaResponsables = 1;
  tamanioPaginaResponsables = 5;

  constructor(
    private route: ActivatedRoute,
    private presenter: BienDetallePresenterService,
    private logVisitaService: LogVisitaService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    const bienId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarVista(bienId);
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

  get responsableActualNombre(): string {
    const responsableActual = this.historialOrdenado.find(item => item.vigente);
    return responsableActual ? this.obtenerNombreResponsable(responsableActual) : this.obtenerNombreUsuario(this.bien?.usuario);
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

  mostrarCambiarResponsable(): void {
    this.selectedUsuarioId = this.bien.ID_USUARIO || null;
    this.showCambiarResponsable = true;
  }

  cancelarCambiarResponsable(): void {
    this.selectedUsuarioId = this.bien.ID_USUARIO || null;
    this.showCambiarResponsable = false;
  }

  guardarResponsable(): void {
    if (!this.selectedUsuarioId || !this.bien) {
      this.message.warning('Selecciona un responsable.');
      return;
    }

    this.isLoading = true;
    const responsableAnterior = this.bien.ID_USUARIO;
    this.bien.ID_USUARIO = this.selectedUsuarioId;

    this.presenter.guardarCambios(this.bien, this.selectedCategoria).subscribe({
      next: () => {
        this.logVisitaService.registrarAccion('cambiar responsable de bien', `/historial-responsables/${this.bien.id}`, {
          bien_id: this.bien.id,
          responsable_anterior_id: responsableAnterior,
          responsable_nuevo_id: this.selectedUsuarioId
        }).subscribe();
        this.message.success('Responsable actualizado correctamente.');
        this.showCambiarResponsable = false;
        this.isLoading = false;
        this.cargarVista(this.bien.id);
      },
      error: error => {
        this.bien.ID_USUARIO = responsableAnterior;
        this.isLoading = false;
        console.error('Error al actualizar responsable:', error);
        this.message.error('No se pudo actualizar el responsable.');
      }
    });
  }

  puedeGuardarResponsable(): boolean {
    return Boolean(this.selectedUsuarioId) && Number(this.selectedUsuarioId) !== Number(this.bien.ID_USUARIO);
  }

  mostrarResponsableActualNoAsignable(): boolean {
    if (!this.bien?.ID_USUARIO) {
      return false;
    }

    return !this.usuariosAdministradores.some(usuario => Number(usuario.id) === Number(this.bien.ID_USUARIO));
  }

  obtenerNombreResponsable(item: Historial): string {
    return this.obtenerNombreUsuario(item.usuario);
  }

  obtenerNombreUsuario(usuario: unknown): string {
    if (!usuario) {
      return 'Sin responsable';
    }

    if (typeof usuario === 'string') {
      return usuario || 'Sin responsable';
    }

    const usuarioData = usuario as { NOMBRES?: string; APELLIDOS?: string; USU?: string; name?: string; nombre?: string };
    const nombre = [usuarioData.NOMBRES, usuarioData.APELLIDOS].filter(Boolean).join(' ').trim();

    return nombre || usuarioData.USU || usuarioData.name || usuarioData.nombre || 'Sin responsable';
  }

  obtenerEstadoResponsable(item: Historial): string {
    const fechaInicio = new Date(item.fecha_inicio).getTime();
    const fechaFin = item.fecha_fin ? new Date(item.fecha_fin).getTime() : Date.now();

    const movimientoEnPeriodo = this.movimientos
      .filter(movimiento => {
        const fechaMovimiento = new Date(movimiento.FECHA_MODIFICACION).getTime();
        return fechaMovimiento >= fechaInicio && fechaMovimiento <= fechaFin;
      })
      .sort((a, b) => new Date(b.FECHA_MODIFICACION).getTime() - new Date(a.FECHA_MODIFICACION).getTime())[0];

    if (movimientoEnPeriodo?.ESTADO) {
      return movimientoEnPeriodo.ESTADO;
    }

    const movimientoAntesDelPeriodo = this.movimientos
      .filter(movimiento => new Date(movimiento.FECHA_MODIFICACION).getTime() <= fechaInicio)
      .sort((a, b) => new Date(b.FECHA_MODIFICACION).getTime() - new Date(a.FECHA_MODIFICACION).getTime())[0];

    return movimientoAntesDelPeriodo?.ESTADO || 'Sin estado';
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

  private cargarVista(bienId: number): void {
    this.presenter.cargarVista(bienId).subscribe({
      next: viewModel => {
        this.bien = viewModel.bien;
        this.categorias = viewModel.categorias;
        this.selectedCategoria = viewModel.selectedCategoria;
        this.ubicaciones = viewModel.ubicaciones;
        this.movimientos = viewModel.movimientos;
        this.usuariosAdministradores = viewModel.usuariosAdministradores;
        this.historial = viewModel.historial;
        this.selectedUsuarioId = this.bien.ID_USUARIO || null;
        this.ajustarPaginaResponsables();
      },
      error: error => console.error('Error al cargar historial de responsables:', error)
    });
  }

  private ajustarPaginaResponsables(): void {
    this.paginaResponsables = Math.min(Math.max(this.paginaResponsables, 1), this.totalPaginasResponsables);
  }
}
