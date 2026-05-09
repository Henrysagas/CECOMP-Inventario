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
import { Ambiente } from '../models/ambiente';
import { Bien } from '../models/bien';
import { Categoria } from '../models/categoria';
import { Detalle } from '../models/detalle';
import { Historial } from '../models/historial';
import { Ubicacion } from '../models/ubicacion';
import { Usuario } from '../models/usuario';
import { BienDetallePresenterService } from '../services/bien-detalle-presenter.service';
import { LogVisitaService } from '../services/log-visita.service';

@Component({
  selector: 'app-detalles',
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
  templateUrl: './detalles.component.html',
  styleUrls: ['./detalles.component.css']
})
export class DetallesComponent implements OnInit {
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
  estados = ['Nuevo', 'Bueno', 'Regular', 'Deficiente', 'Malo', 'RAEE/Chatarra'];
  movimientos: Detalle[] = [];
  isLoading = false;
  usuariosAdministradores: Usuario[] = [];
  historial: Historial[] = [];

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

  mostrarAgregarMovimiento(): void {
    this.showAgregarMovimiento = true;
    this.preseleccionarMovimientoActual();
  }

  cancelarAgregarMovimiento(): void {
    this.showAgregarMovimiento = false;
  }

  buscarAmbientes(): void {
    if (!this.selectedUbicacionId) {
      this.message.warning('Por favor, selecciona una ubicacion primero.');
      return;
    }

    this.presenter.cargarAmbientesPorUbicacion(this.selectedUbicacionId).subscribe({
      next: ambientes => {
        this.ambientes = ambientes;
        this.showAmbienteSelect = true;
      },
      error: error => console.error('Error al obtener ambientes:', error)
    });
  }

  guardarMovimiento(): void {
    if (!this.selectedAmbienteId || !this.selectedEstado) {
      this.message.warning('Por favor, selecciona un ambiente y estado.');
      return;
    }

    this.presenter.agregarMovimiento(this.bien, this.selectedAmbienteId, this.selectedEstado).subscribe({
      next: () => {
        this.logVisitaService.registrarAccion('agregar movimiento de bien', `/detalles/${this.bien.id}`, {
          bien_id: this.bien.id,
          ambiente_id: this.selectedAmbienteId,
          estado: this.selectedEstado
        }).subscribe();
        this.message.success('Movimiento agregado correctamente.');
        this.showAgregarMovimiento = false;
        this.refrescarMovimientos();
      },
      error: error => {
        console.error('Error al agregar movimiento:', error);
        this.message.error('No se pudo agregar el movimiento.');
      }
    });
  }

  editar(): void {
    this.isEditing = true;
  }

  guardarCambios(): void {
    this.isLoading = true;
    const categoriaSeleccionada = this.obtenerCategoriaSeleccionada();

    this.presenter.guardarCambios(this.bien, categoriaSeleccionada).subscribe({
      next: () => {
        this.logVisitaService.registrarAccion('editar bien', `/detalles/${this.bien.id}`, {
          bien_id: this.bien.id,
          codigo: this.bien.codigo,
          categoria_id: this.bien.ID_CATEGORIA,
          usuario_id: this.bien.ID_USUARIO
        }).subscribe();
        this.message.success('Cambios guardados correctamente.');
        this.isEditing = false;
        this.isLoading = false;
      },
      error: error => {
        console.error('Error al guardar cambios:', error);
        this.message.error('No se pudieron guardar los cambios.');
        this.isLoading = false;
      }
    });
  }

  cancelar(): void {
    this.isEditing = false;
    this.cargarVista(this.bien.id);
  }

  onUbicacionChange(event?: Event): void {
    this.showAmbienteSelect = false;
    this.selectedAmbienteId = null;
    this.buscarAmbientes();
  }

  private preseleccionarMovimientoActual(): void {
    const movimientoActual = this.movimientos[0];

    this.selectedEstado = movimientoActual?.ESTADO || '';
    this.agregarEstadoSiNoExiste(this.selectedEstado);
    this.selectedAmbienteId = movimientoActual?.ID_AMBIENTE || null;
    this.selectedUbicacionId = movimientoActual?.ambiente?.ID_UBICACION
      || movimientoActual?.ambiente?.ubicacion?.ID_UBICACION
      || null;

    if (!this.selectedUbicacionId) {
      this.showAmbienteSelect = false;
      return;
    }

    this.presenter.cargarAmbientesPorUbicacion(this.selectedUbicacionId).subscribe({
      next: ambientes => {
        this.ambientes = ambientes;
        this.showAmbienteSelect = true;

        if (!ambientes.some(ambiente => ambiente.ID_AMBIENTE === this.selectedAmbienteId)) {
          this.selectedAmbienteId = null;
        }
      },
      error: error => console.error('Error al obtener ambientes:', error)
    });
  }

  private agregarEstadoSiNoExiste(estado: string): void {
    if (estado && !this.estados.includes(estado)) {
      this.estados = [estado, ...this.estados];
    }
  }

  mostrarUsuarioActualNoAsignable(): boolean {
    if (!this.bien?.ID_USUARIO) {
      return false;
    }

    return !this.usuariosAdministradores.some(usuario => Number(usuario.id) === Number(this.bien.ID_USUARIO));
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
      },
      error: error => console.error('Error al cargar detalle del bien:', error)
    });
  }

  private refrescarMovimientos(): void {
    this.presenter.cargarMovimientos(this.bien.id).subscribe({
      next: movimientos => {
        this.movimientos = movimientos;
        this.bien.movimientos = movimientos;
      },
      error: error => console.error('Error al cargar movimientos:', error)
    });
  }

  private obtenerCategoriaSeleccionada(): Categoria {
    const categoriaId = Number(this.bien.ID_CATEGORIA);
    return this.categorias.find(categoria => categoria.id === categoriaId) || this.selectedCategoria;
  }
}
