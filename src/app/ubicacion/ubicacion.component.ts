import { Component, OnInit } from '@angular/core';
import { UbicacionService } from '../services/ubicacion.service';
import { AmbienteService } from '../services/ambiente.service';
import { DireccionesService } from '../services/direcciones.service';
import { Ubicacion } from '../models/ubicacion';
import { Ambiente } from '../models/ambiente';
import { DireccionModel } from '../models/direccion.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzInputModule } from 'ng-zorro-antd/input';

@Component({
  selector: 'app-ubicacion',
  templateUrl: './ubicacion.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzSelectModule,
    NzButtonModule,
    NzTableModule,
    NzInputModule
  ],
  styleUrls: ['./ubicacion.component.css']
})
export class UbicacionesComponent implements OnInit {
  direcciones: DireccionModel[] = [];
  ubicaciones: Ubicacion[] = [];
  ambientes: Ambiente[] = [];
  selectedDireccion: DireccionModel | null = null;
  selectedUbicacion: Ubicacion | null = null;
  selectedAmbiente: Ambiente | null = null;
  isAddingUbicacion = false;
  isAddingAmbiente = false;
  isAddingDireccion = false;
  newUbicacion: Ubicacion = { ID_UBICACION: 0, NOMBRE: '', CODIGO: '', DIRECCION: 0 };
  newAmbiente: Ambiente = { ID_AMBIENTE: 0, ID_UBICACION: 0, NOMBRE_AMBIENTE: '' };
  newDireccion: DireccionModel = { id: 0, nombre: '' };

  niveles = [
    { value: 'direccion', label: 'Direcciones' },
    { value: 'ubicacion', label: 'Ubicaciones' },
    { value: 'ambiente', label: 'Ambientes' }
  ];
  selectedNivel = 'direccion';

  constructor(
    private ubicacionService: UbicacionService,
    private ambienteService: AmbienteService,
    private direccionesService: DireccionesService
  ) {}

  ngOnInit(): void {
    this.cargarDirecciones();
  }

  cargarDirecciones(): void {
    this.direccionesService.getDirecciones().subscribe(
      (direcciones: DireccionModel[]) => this.direcciones = direcciones,
      error => console.error('Error al obtener direcciones:', error)
    );
  }

  cargarUbicaciones(direccion: DireccionModel): void {
    if (direccion?.id) {
      this.selectedDireccion = direccion;
      this.ubicacionService.getUbicacionesByDireccion(direccion.id).subscribe(
        (ubicaciones: Ubicacion[]) => {
          this.ubicaciones = ubicaciones;
          this.selectedNivel = 'ubicacion';
        },
        error => console.error('Error al obtener ubicaciones:', error)
      );
    }
  }

  verAmbientes(ubicacion: Ubicacion): void {
    this.selectedUbicacion = ubicacion;
    this.ambienteService.getAmbientesByUbicacion(ubicacion.ID_UBICACION).subscribe(
      (ambientes: Ambiente[]) => {
        this.ambientes = ambientes;
        this.selectedNivel = 'ambiente';
      },
      error => console.error('Error al obtener ambientes:', error)
    );
  }

  cambiarNivel(nivel: string): void {
    this.selectedNivel = nivel;
    if (nivel === 'direccion') {
      this.volverADirecciones();
    } else if (nivel === 'ubicacion' && this.selectedDireccion) {
      this.cargarUbicaciones(this.selectedDireccion);
    } else if (nivel === 'ambiente' && this.selectedUbicacion) {
      this.verAmbientes(this.selectedUbicacion);
    }
  }

  mostrarAgregarUbicacion(): void {
    this.isAddingUbicacion = true;
  }

  mostrarAgregarAmbiente(): void {
    this.isAddingAmbiente = true;
  }

  mostrarAgregarDireccion(): void {
    this.isAddingDireccion = true;
  }

  guardarDireccion(): void {
    this.direccionesService.addDireccion(this.newDireccion).subscribe(
      () => {
        this.isAddingDireccion = false;
        this.cargarDirecciones();
        this.newDireccion = { id: 0, nombre: '' };
      },
      error => console.error('Error al agregar dirección:', error)
    );
  }
  
  guardarUbicacion(): void {
    if (!this.selectedDireccion) {
      console.error('No hay una dirección seleccionada.');
      return;
    }
  
    this.newUbicacion.DIRECCION = this.selectedDireccion.id;
  
    this.ubicacionService.addUbicacion(this.newUbicacion).subscribe(
      () => {
        this.isAddingUbicacion = false;
        if (this.selectedDireccion) {
          this.cargarUbicaciones(this.selectedDireccion);
        }
        this.newUbicacion = { ID_UBICACION: 0, NOMBRE: '', CODIGO: '', DIRECCION: 0 };
      },
      error => console.error('Error al agregar ubicación:', error)
    );
  }
  
  guardarAmbiente(): void {
    if (!this.selectedUbicacion) {
      console.error('No hay una ubicación seleccionada.');
      return;
    }
  
    this.newAmbiente.ID_UBICACION = this.selectedUbicacion.ID_UBICACION;
  
    this.ambienteService.addAmbiente(this.selectedUbicacion.ID_UBICACION, this.newAmbiente).subscribe(
      () => {
        this.isAddingAmbiente = false;
        if (this.selectedUbicacion) {
          this.verAmbientes(this.selectedUbicacion);
        }
        this.newAmbiente = { ID_AMBIENTE: 0, ID_UBICACION: 0, NOMBRE_AMBIENTE: '' };
      },
      error => console.error('Error al agregar ambiente:', error)
    );
  }
  
  eliminarDireccion(idDireccion: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta dirección?')) {
      this.direccionesService.deleteDireccion(idDireccion).subscribe(
        () => {
          this.cargarDirecciones();
          if (this.selectedDireccion?.id === idDireccion) {
            this.selectedDireccion = null;
            this.ubicaciones = [];
          }
        },
        error => console.error('Error al eliminar dirección:', error)
      );
    }
  }

  eliminarUbicacion(idUbicacion: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta ubicación?')) {
      this.ubicacionService.eliminarUbicacion(idUbicacion).subscribe(
        () => {
          if (this.selectedDireccion) {
            this.cargarUbicaciones(this.selectedDireccion);
          }
          if (this.selectedUbicacion?.ID_UBICACION === idUbicacion) {
            this.selectedUbicacion = null;
            this.ambientes = [];
          }
        },
        error => console.error('Error al eliminar ubicación:', error)
      );
    }
  }

  eliminarAmbiente(idAmbiente: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este ambiente?')) {
      this.ambienteService.eliminarAmbiente(idAmbiente).subscribe(
        () => {
          if (this.selectedUbicacion) {
            this.verAmbientes(this.selectedUbicacion);
          }
        },
        error => console.error('Error al eliminar ambiente:', error)
      );
    }
  }

  volverADirecciones(): void {
    this.selectedDireccion = null;
    this.ubicaciones = [];
    this.selectedUbicacion = null;
    this.ambientes = [];
    this.selectedNivel = 'direccion';
  }

  volverAUbicaciones(): void {
    this.selectedUbicacion = null;
    this.ambientes = [];
    this.selectedNivel = 'ubicacion';
  }

  cancelar(): void {
    this.isAddingUbicacion = false;
    this.isAddingAmbiente = false;
    this.isAddingDireccion = false;
  }
  
  editarAmbiente(idAmbiente: number): void {
    console.log('Editando ambiente con ID:', idAmbiente);
    //falta implementar
  }
}