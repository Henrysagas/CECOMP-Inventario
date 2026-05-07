import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableComponent, NzTableModule } from 'ng-zorro-antd/table';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { Ambiente } from '../../models/ambiente';
import { Bien } from '../../models/bien';
import { Categoria } from '../../models/categoria';
import { Detalle } from '../../models/detalle';
import { Historial } from '../../models/historial';
import { Ubicacion } from '../../models/ubicacion';
import { Usuario } from '../../models/usuario';
import { BienDetallePresenterService } from '../../services/bien-detalle-presenter.service';

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

  constructor(
    private route: ActivatedRoute,
    private presenter: BienDetallePresenterService
  ) {}

  ngOnInit(): void {
    const bienId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarVista(bienId);
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
      error: error => console.error('Error al cargar historial de responsables:', error)
    });
  }
}
