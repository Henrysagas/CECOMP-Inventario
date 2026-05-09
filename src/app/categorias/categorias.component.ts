import { Component, OnInit } from '@angular/core';
import { CategoriaService } from '../services/categoria.service';
import { BienService } from '../services/bien.service';
import { Categoria } from '../models/categoria';
import { Bien } from '../models/bien';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { LogVisitaService } from '../services/log-visita.service';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzMessageModule,
    NzModalModule
  ],
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.css'],
})
export class CategoriasComponent implements OnInit {
  categorias: Categoria[] = [];
  categoriaSeleccionada: Categoria = { id: 0, NOMBRE_CATEGORIA: '' };
  categoriaFormulario: Categoria = { id: 0, NOMBRE_CATEGORIA: '' };
  filtroCategoria = '';
  mensaje = '';
  tipoMensaje: 'success' | 'error' | '' = '';
  cargando = false;
  verificandoEliminacion = false;
  isEditing = false;
  isAdding = false;

  constructor(
    private categoriaService: CategoriaService,
    private bienService: BienService,
    private logVisitaService: LogVisitaService,
    private message: NzMessageService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.cargarCategorias();
  }

  cargarCategorias(): void {
    this.cargando = true;
    this.categoriaService.getCategorias().subscribe(
      (data: Categoria[]) => {
        this.categorias = data;
        this.cargando = false;
      },
      (error) => {
        this.cargando = false;
        this.mostrarMensaje('No se pudieron cargar las categorias.', 'error');
        console.error('Error al obtener las categorias:', error);
      }
    );
  }

  get categoriasFiltradas(): Categoria[] {
    const filtro = this.filtroCategoria.trim().toLowerCase();

    if (!filtro) {
      return this.categorias;
    }

    return this.categorias.filter((categoria) =>
      categoria.NOMBRE_CATEGORIA.toLowerCase().includes(filtro)
    );
  }

  seleccionarCategoria(categoria: Categoria): void {
    this.categoriaSeleccionada = categoria;
    this.isAdding = false;
    this.isEditing = false;
    this.limpiarMensaje();
  }

  mostrarFormularioAgregar(): void {
    this.isAdding = true;
    this.isEditing = false;
    this.categoriaFormulario = { id: 0, NOMBRE_CATEGORIA: '' };
    this.limpiarMensaje();
  }

  editarCategoria(): void {
    if (!this.categoriaSeleccionada.id) {
      this.mostrarMensaje('Selecciona una categoria para editarla.', 'error');
      return;
    }

    this.isEditing = true;
    this.isAdding = false;
    this.categoriaFormulario = { ...this.categoriaSeleccionada };
    this.limpiarMensaje();
  }

  guardarCambios(): void {
    const nombre = this.categoriaFormulario.NOMBRE_CATEGORIA.trim();

    if (!nombre) {
      this.mostrarMensaje('Escribe un nombre para la categoria.', 'error');
      return;
    }

    this.categoriaFormulario.NOMBRE_CATEGORIA = nombre;

    if (this.isEditing) {
      this.categoriaService.updateCategoria(this.categoriaFormulario).subscribe(
        () => {
          this.logVisitaService.registrarAccion('editar categoria', '/categorias', {
            categoria_id: this.categoriaFormulario.id,
            nombre: this.categoriaFormulario.NOMBRE_CATEGORIA
          }).subscribe();
          this.mostrarMensaje('Categoria actualizada correctamente.', 'success');
          this.cargarCategorias();
          this.isEditing = false;
          this.categoriaSeleccionada = { ...this.categoriaFormulario };
        },
        (error) => {
          this.mostrarMensaje('No se pudo actualizar la categoria.', 'error');
          console.error('Error al actualizar la categoria:', error);
        }
      );
    } else if (this.isAdding) {
      this.categoriaService.createCategoria(this.categoriaFormulario).subscribe(
        (response) => {
          this.logVisitaService.registrarAccion('agregar categoria', '/categorias', {
            categoria_id: response?.id ?? this.categoriaFormulario.id,
            nombre: this.categoriaFormulario.NOMBRE_CATEGORIA
          }).subscribe();
          this.mostrarMensaje('Categoria agregada correctamente.', 'success');
          this.cargarCategorias();
          this.isAdding = false;
          this.categoriaFormulario = { id: 0, NOMBRE_CATEGORIA: '' };
        },
        (error) => {
          this.mostrarMensaje('No se pudo agregar la categoria.', 'error');
          console.error('Error al agregar la categoria:', error);
        }
      );
    }
  }

  eliminarCategoria(): void {
    if (!this.categoriaSeleccionada.id) {
      this.mostrarMensaje('Selecciona una categoria para eliminarla.', 'error');
      return;
    }

    const categoria = this.categoriaSeleccionada;
    this.verificandoEliminacion = true;

    this.bienService.getBienes().subscribe(
      (bienes: Bien[]) => {
        this.verificandoEliminacion = false;
        const bienesAsociados = bienes.filter((bien) =>
          bien.ID_CATEGORIA === categoria.id || bien.categoria?.id === categoria.id
        );

        if (bienesAsociados.length > 0) {
          this.mostrarMensaje(
            `No se puede eliminar la categoria "${categoria.NOMBRE_CATEGORIA}" porque tiene ${bienesAsociados.length} bien(es) asociado(s).`,
            'error'
          );
          return;
        }

        this.modal.confirm({
          nzTitle: 'Eliminar categoria',
          nzContent: `Deseas eliminar la categoria "${categoria.NOMBRE_CATEGORIA}"?`,
          nzOkText: 'Eliminar',
          nzOkDanger: true,
          nzCancelText: 'Cancelar',
          nzOnOk: () => this.confirmarEliminarCategoria(categoria)
        });
      },
      (error) => {
        this.verificandoEliminacion = false;
        this.mostrarMensaje('No se pudo verificar si la categoria tiene bienes asociados.', 'error');
        console.error('Error al verificar bienes de la categoria:', error);
      }
    );
  }

  private confirmarEliminarCategoria(categoria: Categoria): void {
    this.categoriaService.deleteCategoria(categoria.id).subscribe(
      () => {
        this.logVisitaService.registrarAccion('eliminar categoria', '/categorias', {
          categoria_id: categoria.id,
          nombre: categoria.NOMBRE_CATEGORIA
        }).subscribe();
        this.mostrarMensaje('Categoria eliminada correctamente.', 'success');
        this.cargarCategorias();
        this.categoriaSeleccionada = { id: 0, NOMBRE_CATEGORIA: '' };
      },
      (error) => {
        this.mostrarMensaje('No se pudo eliminar la categoria.', 'error');
        console.error('Error al eliminar la categoria:', error);
      }
    );
  }

  cancelarAccion(): void {
    this.isEditing = false;
    this.isAdding = false;
    this.categoriaFormulario = { id: 0, NOMBRE_CATEGORIA: '' };
    this.limpiarMensaje();
  }

  limpiarSeleccion(): void {
    this.categoriaSeleccionada = { id: 0, NOMBRE_CATEGORIA: '' };
    this.isEditing = false;
    this.isAdding = false;
  }

  private mostrarMensaje(mensaje: string, tipo: 'success' | 'error'): void {
    this.mensaje = mensaje;
    this.tipoMensaje = tipo;
    tipo === 'success' ? this.message.success(mensaje) : this.message.error(mensaje);
  }

  private limpiarMensaje(): void {
    this.mensaje = '';
    this.tipoMensaje = '';
  }
}
