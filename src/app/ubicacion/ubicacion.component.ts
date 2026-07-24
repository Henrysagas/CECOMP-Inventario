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
  isChangingName = false;
  private vistaInicialCargada = false;
  changingNameType: 'direccion' | 'ubicacion' | 'ambiente' | null = null;
  changingNameValue = '';
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
      (direcciones: DireccionModel[]) => {
        this.direcciones = direcciones;
        if (!this.vistaInicialCargada) {
          this.vistaInicialCargada = true;
          this.mostrarCecompPorDefecto();
        }
      },
      error => console.error('Error al obtener direcciones:', error)
    );
  }

  private mostrarCecompPorDefecto(): void {
    this.ubicacionService.getUbicaciones().subscribe(
      (ubicaciones: Ubicacion[]) => {
        const cecomp = ubicaciones.find(ubicacion => this.normalizarNombre(ubicacion.NOMBRE) === 'cecomp');
        if (!cecomp) {
          return;
        }

        this.selectedDireccion = this.direcciones.find(direccion => direccion.id === cecomp.DIRECCION) ?? null;
        this.verAmbientes(cecomp);
      },
      error => console.error('Error al buscar la ubicacion CECOMP:', error)
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
    this.cancelarCambioNombre();
    this.isAddingUbicacion = true;
  }

  mostrarAgregarAmbiente(): void {
    this.cancelarCambioNombre();
    this.isAddingAmbiente = true;
  }

  mostrarAgregarDireccion(): void {
    this.cancelarCambioNombre();
    this.isAddingDireccion = true;
  }

  guardarDireccion(): void {
    const nombre = this.newDireccion.nombre.trim();
    if (!nombre) {
      this.message.warning('Ingrese el nombre de la direccion.');
      return;
    }
    if (this.existeNombre(this.direcciones, item => item.nombre, nombre)) {
      this.message.warning('Ya existe una direccion con ese nombre.');
      return;
    }
    this.newDireccion.nombre = nombre;

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

    const nombre = this.newUbicacion.NOMBRE.trim();
    if (!nombre) {
      this.message.warning('Ingrese el nombre de la ubicacion.');
      return;
    }
    if (this.existeNombre(this.ubicaciones, item => item.NOMBRE, nombre)) {
      this.message.warning('Ya existe una ubicacion con ese nombre en esta direccion.');
      return;
    }
  
    this.newUbicacion.NOMBRE = nombre;
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

    const nombre = this.newAmbiente.NOMBRE_AMBIENTE.trim();
    if (!nombre) {
      this.message.warning('Ingrese el nombre del ambiente.');
      return;
    }
    if (this.existeNombre(this.ambientes, item => item.NOMBRE_AMBIENTE, nombre)) {
      this.message.warning('Ya existe un ambiente con ese nombre en esta ubicacion.');
      return;
    }
  
    this.newAmbiente.NOMBRE_AMBIENTE = nombre;
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

  mostrarCambiarNombreDireccion(direccion: DireccionModel): void {
    this.selectedDireccion = direccion;
    this.iniciarCambioNombre('direccion', direccion.nombre);
  }

  mostrarCambiarNombreUbicacion(ubicacion: Ubicacion): void {
    this.selectedUbicacion = ubicacion;
    this.iniciarCambioNombre('ubicacion', ubicacion.NOMBRE);
  }

  mostrarCambiarNombreAmbiente(ambiente: Ambiente): void {
    this.selectedAmbiente = ambiente;
    this.iniciarCambioNombre('ambiente', ambiente.NOMBRE_AMBIENTE);
  }

  guardarCambioNombre(): void {
    const nuevoNombre = this.changingNameValue.trim();

    if (!nuevoNombre) {
      this.message.warning('El nombre no puede estar vacio.');
      return;
    }

    if (this.changingNameType === 'direccion') {
      this.guardarNombreDireccion(nuevoNombre);
    } else if (this.changingNameType === 'ubicacion') {
      this.guardarNombreUbicacion(nuevoNombre);
    } else if (this.changingNameType === 'ambiente') {
      this.guardarNombreAmbiente(nuevoNombre);
    }
  }

  cancelarCambioNombre(): void {
    this.isChangingName = false;
    this.changingNameType = null;
    this.changingNameValue = '';
  }

  private iniciarCambioNombre(tipo: 'direccion' | 'ubicacion' | 'ambiente', nombreActual: string): void {
    this.isAddingUbicacion = false;
    this.isAddingAmbiente = false;
    this.isAddingDireccion = false;
    this.isChangingName = true;
    this.changingNameType = tipo;
    this.changingNameValue = nombreActual;
  }

  private guardarNombreDireccion(nuevoNombre: string): void {
    const direccion = this.selectedDireccion;

    if (!direccion) {
      return;
    }

    if (this.normalizarNombre(nuevoNombre) === this.normalizarNombre(direccion.nombre)) {
      this.cancelarCambioNombre();
      return;
    }
    if (this.existeNombre(this.direcciones, item => item.nombre, nuevoNombre, item => item.id === direccion.id)) {
      this.message.warning('Ya existe una direccion con ese nombre.');
      return;
    }

    this.direccionesService.updateDireccion(direccion.id, { ...direccion, nombre: nuevoNombre }).subscribe(
      (direccionActualizada: DireccionModel) => {
        this.selectedDireccion = direccionActualizada;
        this.cargarDirecciones();
        this.cancelarCambioNombre();
        this.message.success('Nombre de direccion actualizado correctamente.');
      },
      error => {
        console.error('Error al cambiar nombre de direccion:', error);
        this.message.error('No se pudo cambiar el nombre de la direccion.');
      }
    );
  }

  private guardarNombreUbicacion(nuevoNombre: string): void {
    const ubicacion = this.selectedUbicacion;

    if (!ubicacion) {
      return;
    }

    if (this.normalizarNombre(nuevoNombre) === this.normalizarNombre(ubicacion.NOMBRE)) {
      this.cancelarCambioNombre();
      return;
    }
    if (this.existeNombre(this.ubicaciones, item => item.NOMBRE, nuevoNombre, item => item.ID_UBICACION === ubicacion.ID_UBICACION)) {
      this.message.warning('Ya existe una ubicacion con ese nombre en esta direccion.');
      return;
    }

    this.ubicacionService.updateUbicacion(ubicacion.ID_UBICACION, { ...ubicacion, NOMBRE: nuevoNombre }).subscribe(
      (ubicacionActualizada: Ubicacion) => {
        this.selectedUbicacion = ubicacionActualizada;
        if (this.selectedDireccion) {
          this.cargarUbicaciones(this.selectedDireccion);
        }
        this.cancelarCambioNombre();
        this.message.success('Nombre de ubicacion actualizado correctamente.');
      },
      error => {
        console.error('Error al cambiar nombre de ubicacion:', error);
        this.message.error('No se pudo cambiar el nombre de la ubicacion.');
      }
    );
  }

  private guardarNombreAmbiente(nuevoNombre: string): void {
    const ambiente = this.selectedAmbiente;

    if (!ambiente) {
      return;
    }

    if (this.normalizarNombre(nuevoNombre) === this.normalizarNombre(ambiente.NOMBRE_AMBIENTE)) {
      this.cancelarCambioNombre();
      return;
    }
    if (this.existeNombre(this.ambientes, item => item.NOMBRE_AMBIENTE, nuevoNombre, item => item.ID_AMBIENTE === ambiente.ID_AMBIENTE)) {
      this.message.warning('Ya existe un ambiente con ese nombre en esta ubicacion.');
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
        this.cancelarCambioNombre();
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

  volverADirecciones(): void {
    this.selectedDireccion = null;
    this.ubicaciones = [];
    this.selectedUbicacion = null;
    this.ambientes = [];
    this.selectedNivel = 'direccion';
  }

  volverAUbicaciones(): void {
    this.cancelar();
    this.selectedUbicacion = null;
    this.selectedAmbiente = null;
    this.ambientes = [];
    this.selectedNivel = 'ubicacion';
  }

  volver(): void {
    if (this.selectedNivel === 'ambiente' && this.selectedDireccion) {
      this.cargarUbicaciones(this.selectedDireccion);
      this.selectedUbicacion = null;
      this.selectedAmbiente = null;
      this.ambientes = [];
      return;
    }

    this.volverADirecciones();
  }

  private normalizarNombre(nombre: string): string {
    return nombre.trim().toLocaleLowerCase('es');
  }

  private existeNombre<T>(
    items: T[],
    obtenerNombre: (item: T) => string,
    nombre: string,
    excluir: (item: T) => boolean = () => false
  ): boolean {
    const nombreNormalizado = this.normalizarNombre(nombre);
    return items.some(item => !excluir(item) && this.normalizarNombre(obtenerNombre(item)) === nombreNormalizado);
  }

  cancelar(): void {
    this.isAddingUbicacion = false;
    this.isAddingAmbiente = false;
    this.isAddingDireccion = false;
    this.cancelarCambioNombre();
  }
  
}
