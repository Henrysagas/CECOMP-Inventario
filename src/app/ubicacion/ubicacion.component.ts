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
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

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
    NzInputModule,
    NzMessageModule,
    NzModalModule
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
    private direccionesService: DireccionesService,
    private message: NzMessageService,
    private modal: NzModalService
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
    this.modal.confirm({
      nzTitle: 'Eliminar direccion',
      nzContent: 'Se eliminara la direccion seleccionada. Deseas continuar?',
      nzOkText: 'Eliminar',
      nzOkDanger: true,
      nzCancelText: 'Cancelar',
      nzOnOk: () => this.confirmarEliminarDireccion(idDireccion)
    });
  }

  eliminarUbicacion(idUbicacion: number): void {
    this.modal.confirm({
      nzTitle: 'Eliminar ubicacion',
      nzContent: 'Se eliminara la ubicacion seleccionada. Deseas continuar?',
      nzOkText: 'Eliminar',
      nzOkDanger: true,
      nzCancelText: 'Cancelar',
      nzOnOk: () => this.confirmarEliminarUbicacion(idUbicacion)
    });
  }

  eliminarAmbiente(idAmbiente: number): void {
    this.modal.confirm({
      nzTitle: 'Eliminar ambiente',
      nzContent: 'Se eliminara el ambiente seleccionado. Deseas continuar?',
      nzOkText: 'Eliminar',
      nzOkDanger: true,
      nzCancelText: 'Cancelar',
      nzOnOk: () => this.confirmarEliminarAmbiente(idAmbiente)
    });
  }

  cambiarNombreDireccion(direccion: DireccionModel): void {
    const nuevoNombre = this.pedirNuevoNombre('direccion', direccion.nombre);

    if (!nuevoNombre || nuevoNombre === direccion.nombre.trim()) {
      return;
    }

    this.direccionesService.updateDireccion(direccion.id, { ...direccion, nombre: nuevoNombre }).subscribe(
      (direccionActualizada: DireccionModel) => {
        this.selectedDireccion = direccionActualizada;
        this.cargarDirecciones();
        this.message.success('Nombre de direccion actualizado correctamente.');
      },
      error => {
        console.error('Error al cambiar nombre de direccion:', error);
        this.message.error('No se pudo cambiar el nombre de la direccion.');
      }
    );
  }

  cambiarNombreUbicacion(ubicacion: Ubicacion): void {
    const nuevoNombre = this.pedirNuevoNombre('ubicacion', ubicacion.NOMBRE);

    if (!nuevoNombre || nuevoNombre === ubicacion.NOMBRE.trim()) {
      return;
    }

    this.ubicacionService.updateUbicacion(ubicacion.ID_UBICACION, { ...ubicacion, NOMBRE: nuevoNombre }).subscribe(
      (ubicacionActualizada: Ubicacion) => {
        this.selectedUbicacion = ubicacionActualizada;
        if (this.selectedDireccion) {
          this.cargarUbicaciones(this.selectedDireccion);
        }
        this.message.success('Nombre de ubicacion actualizado correctamente.');
      },
      error => {
        console.error('Error al cambiar nombre de ubicacion:', error);
        this.message.error('No se pudo cambiar el nombre de la ubicacion.');
      }
    );
  }

  cambiarNombreAmbiente(ambiente: Ambiente): void {
    const nuevoNombre = this.pedirNuevoNombre('ambiente', ambiente.NOMBRE_AMBIENTE);

    if (!nuevoNombre || nuevoNombre === ambiente.NOMBRE_AMBIENTE.trim()) {
      return;
    }

    this.ambienteService.updateAmbiente(ambiente.ID_AMBIENTE, {
      ...ambiente,
      nombre: nuevoNombre,
      NOMBRE_AMBIENTE: nuevoNombre
    }).subscribe(
      (ambienteActualizado: Ambiente) => {
        this.selectedAmbiente = ambienteActualizado;
        if (this.selectedUbicacion) {
          this.verAmbientes(this.selectedUbicacion);
        }
        this.message.success('Nombre de ambiente actualizado correctamente.');
      },
      error => {
        console.error('Error al cambiar nombre de ambiente:', error);
        this.message.error('No se pudo cambiar el nombre del ambiente.');
      }
    );
  }

  private confirmarEliminarDireccion(idDireccion: number): void {
    this.direccionesService.deleteDireccion(idDireccion).subscribe(
      () => {
        this.cargarDirecciones();
        if (this.selectedDireccion?.id === idDireccion) {
          this.selectedDireccion = null;
          this.ubicaciones = [];
        }
        this.message.success('Direccion eliminada correctamente.');
      },
      error => {
        console.error('Error al eliminar direccion:', error);
        this.message.error('No se pudo eliminar la direccion.');
      }
    );
  }

  private confirmarEliminarUbicacion(idUbicacion: number): void {
    this.ubicacionService.eliminarUbicacion(idUbicacion).subscribe(
      () => {
        if (this.selectedDireccion) {
          this.cargarUbicaciones(this.selectedDireccion);
        }
        if (this.selectedUbicacion?.ID_UBICACION === idUbicacion) {
          this.selectedUbicacion = null;
          this.ambientes = [];
        }
        this.message.success('Ubicacion eliminada correctamente.');
      },
      error => {
        console.error('Error al eliminar ubicacion:', error);
        this.message.error('No se pudo eliminar la ubicacion.');
      }
    );
  }

  private confirmarEliminarAmbiente(idAmbiente: number): void {
    this.ambienteService.eliminarAmbiente(idAmbiente).subscribe(
      () => {
        if (this.selectedUbicacion) {
          this.verAmbientes(this.selectedUbicacion);
        }
        this.message.success('Ambiente eliminado correctamente.');
      },
      error => {
        console.error('Error al eliminar ambiente:', error);
        this.message.error('No se pudo eliminar el ambiente.');
      }
    );
  }

  private pedirNuevoNombre(tipo: string, nombreActual: string): string | null {
    const nuevoNombre = window.prompt(`Nuevo nombre de ${tipo}:`, nombreActual);

    if (nuevoNombre === null) {
      return null;
    }

    const nombreLimpio = nuevoNombre.trim();

    if (!nombreLimpio) {
      this.message.warning('El nombre no puede estar vacio.');
      return null;
    }

    return nombreLimpio;
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
  
}
