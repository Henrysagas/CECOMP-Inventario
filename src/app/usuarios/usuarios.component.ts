import { Component, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { UsuarioService } from '../services/usuario.service';
import { Usuario } from '../models/usuario';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTableModule } from 'ng-zorro-antd/table'; // Asegúrate de importar esto
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzTableComponent } from 'ng-zorro-antd/table';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BienService } from '../services/bien.service';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzInputModule } from 'ng-zorro-antd/input';


@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [NzDescriptionsModule,FormsModule,CommonModule,NzTableComponent,NzSelectModule,NzTableModule,NzGridModule,
    RouterLink,NzButtonModule,
    NzIconModule,NzCheckboxModule,NzTabsModule,NzInputModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  bienes: any[] = []; // Lista de bienes asignados al usuario
  isConfirmModalVisible = false; // Controla la visibilidad del modal de confirmación
  usuarioSeleccionado: Usuario | null = null; // Usuario seleccionado para cambiar a administrador
  seleccionarTodos: boolean = false;
  usuarioDestino: number | null = null;
  usuarioOrigenId: number | null = null;
  mostrarInactivos: boolean = false;
  transfiriendoBienes = false;
  cargandoBienes = false;
  tabSeleccionado = 0;
  busquedaBienes = '';
  categoriaFiltro: number | null = null;
  estadoSeleccionFiltro: 'todos' | 'seleccionados' | 'pendientes' = 'todos';

  roles = [
    { id: 1, nombre: 'Administrador' },
    { id: 2, nombre: 'Usuario Normal' }
  ];

  get usuariosActivos(): Usuario[] {
    return this.usuarios.filter(u => u.estado !== 'Inactivo' && u.id !== this.usuarioOrigenId);
  }

  get categoriasBienes(): Array<{ id: number; nombre: string }> {
    const categorias = new Map<number, string>();

    this.bienes.forEach(bien => {
      const id = bien.ID_CATEGORIA ?? bien.categoria?.id;
      const nombre = bien.categoria?.NOMBRE_CATEGORIA;

      if (id && nombre) {
        categorias.set(id, nombre);
      }
    });

    return Array.from(categorias, ([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  get bienesFiltradosMovimiento(): any[] {
    const termino = this.normalizarTexto(this.busquedaBienes);

    return this.bienes.filter(bien => {
      const coincideBusqueda = !termino || [
        bien.codigo,
        bien.DESCRIPCION,
        bien.categoria?.NOMBRE_CATEGORIA
      ].some(valor => this.normalizarTexto(valor).includes(termino));

      const idCategoria = bien.ID_CATEGORIA ?? bien.categoria?.id;
      const coincideCategoria = !this.categoriaFiltro || idCategoria === this.categoriaFiltro;
      const coincideSeleccion =
        this.estadoSeleccionFiltro === 'todos' ||
        (this.estadoSeleccionFiltro === 'seleccionados' && bien.seleccionado) ||
        (this.estadoSeleccionFiltro === 'pendientes' && !bien.seleccionado);

      return coincideBusqueda && coincideCategoria && coincideSeleccion;
    });
  }

  get cantidadSeleccionada(): number {
    return this.bienes.filter(bien => bien.seleccionado).length;
  }

  constructor(
    private usuariosService: UsuarioService,
    private bienService: BienService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.usuariosService.getUsuarios().subscribe({
      next: (data) => {
        this.usuarios = this.mostrarInactivos 
          ? data 
          : data.filter(usuario => usuario.estado !== 'Inactivo');
      },
      error: () => {
        this.message.error('Error al cargar usuarios');
      }
    });
  }

  toggleMostrarInactivos(): void {
    this.cargarUsuarios();
  }

  eliminarUsuario(id: number): void {
    // Primero obtenemos los bienes del usuario
    this.usuariosService.getBienesPorUsuario(id).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          // Si tiene bienes, mostramos un mensaje de error
          this.message.error('No se puede eliminar el usuario porque tiene bienes asignados');
        } else {
          // Si no tiene bienes, cambiamos el rol a 3 (eliminado)
          const usuario = this.usuarios.find(u => u.id === id);
          if (usuario) {
            usuario.ID_ROL = 3; // Cambiamos el rol a "eliminado"
            this.usuariosService.updateRol(usuario.id, usuario.ID_ROL).subscribe({
              next: () => {
                this.message.success('Usuario eliminado (rol cambiado) correctamente');
                this.cargarUsuarios(); // Recargar lista
              },
              error: () => {
                this.message.error('Error al actualizar el rol');
              }
            });
          }
        }
      },
      error: () => {
        this.message.error('Error al verificar los bienes del usuario');
      }
    });
  }

  prepararTransferenciaDesdeUsuario(idUsuario: number): void {
    this.tabSeleccionado = 1;
    this.cargarBienesDeOrigen(idUsuario);
  }

  cargarBienesDeOrigen(idUsuario: number | null): void {
    this.limpiarEstadoTransferencia();

    if (!idUsuario) {
      this.usuarioOrigenId = null;
      return;
    }

    this.usuarioOrigenId = idUsuario;
    this.cargandoBienes = true;

    this.usuariosService.getBienesPorUsuario(idUsuario).subscribe({
      next: (data) => {
        this.bienes = data.map(bien => ({ ...bien, seleccionado: false }));
        this.actualizarSeleccionarTodos();
        this.cargandoBienes = false;
      },
      error: (err) => {
        console.error('Error al cargar los bienes:', err);
        this.cargandoBienes = false;
        if (err.status === 404) {
          this.message.info('El usuario no tiene bienes asignados');
        } else {
          this.message.error('Error al cargar los bienes del usuario');
        }
      }
    });
  }

  // Función llamada cuando se cambia el rol
  onRolChange(usuario: Usuario): void {
    if (usuario.ID_ROL === 1) {
      this.usuarioSeleccionado = usuario; // Guardamos el usuario seleccionado
      this.isConfirmModalVisible = true; // Mostramos el modal de confirmación
    }
  }
  toggleMostrarEliminados(): void {
    this.mostrarInactivos = !this.mostrarInactivos;
    this.cargarUsuarios(); // Recargar lista al cambiar el estado del checkbox
  }
  // Confirmación del cambio de rol
  confirmarCambioRol(): void {
    if (this.usuarioSeleccionado) {
      this.actualizarRol(this.usuarioSeleccionado); // Actualiza el rol del usuario a administrador
      this.isConfirmModalVisible = false; // Cierra el modal
    }
  }

  toggleSeleccionarTodos(): void {
    this.bienesFiltradosMovimiento.forEach(bien => bien.seleccionado = this.seleccionarTodos);
  }

  actualizarSeleccionarTodos(): void {
    const bienesVisibles = this.bienesFiltradosMovimiento;
    this.seleccionarTodos = bienesVisibles.length > 0 && bienesVisibles.every(bien => bien.seleccionado);
  }

  limpiarFiltrosMovimiento(): void {
    this.busquedaBienes = '';
    this.categoriaFiltro = null;
    this.estadoSeleccionFiltro = 'todos';
    this.actualizarSeleccionarTodos();
  }

  async transferirBienes(): Promise<void> {
    const bienesSeleccionados = this.bienes.filter(bien => bien.seleccionado);

    if (!this.usuarioDestino) {
      this.message.warning('Debe seleccionar un usuario de destino');
      return;
    }
    if (bienesSeleccionados.length === 0) {
      this.message.warning('Debe seleccionar al menos un bien para transferir');
      return;
    }

    if (this.usuarioDestino === this.usuarioOrigenId) {
      this.message.warning('Seleccione un usuario distinto al propietario actual');
      return;
    }

    this.transfiriendoBienes = true;

    try {
      const actualizaciones = bienesSeleccionados.map(bien => {
        const bienActualizado = {
          id: bien.id,
          codigo: bien.codigo,
          ID_CATEGORIA: bien.ID_CATEGORIA,
          ID_USUARIO: this.usuarioDestino!,
          DESCRIPCION: bien.DESCRIPCION,
          FECHA_INGRESO: bien.FECHA_INGRESO
        };

        return firstValueFrom(this.bienService.updateBien(bienActualizado));
      });

      await Promise.all(actualizaciones);
      this.message.success('Bienes transferidos correctamente');
      this.cargarBienesDeOrigen(this.usuarioOrigenId);
      this.cargarUsuarios();
    } catch (error) {
      console.error('Error al transferir bienes:', error);
      this.message.error('Error al transferir bienes');
    } finally {
      this.transfiriendoBienes = false;
    }
  }
  
  actualizarRol(usuario: Usuario): void {
    this.usuariosService.updateRol(usuario.id, usuario.ID_ROL).subscribe({
      next: () => {
        this.message.success('Rol actualizado correctamente');
      },
      error: () => {
        this.message.error('Error al actualizar el rol');
      }
    });
  }

  navigateToRegister(): void {
    window.location.href = '/register'; // Redirige usando un enlace absoluto clásico
  }

  cambiarEstadoUsuario(usuario: Usuario): void {
    if (usuario.estado === 'Activo') {
      // Verificar si tiene bienes asignados antes de inactivar
      this.usuariosService.getBienesPorUsuario(usuario.id).subscribe({
        next: (bienes) => {
          if (bienes.length > 0) {
            this.message.error('No se puede inactivar un usuario con bienes asignados.');
          } else {
            usuario.estado = 'Inactivo';
            this.actualizarEstadoUsuario(usuario);
          }
        },
        error: () => {
          this.message.error('Error al verificar los bienes del usuario.');
        }
      });
    } else {
      // Si está inactivo, simplemente lo activamos
      usuario.estado = 'Activo';
      this.actualizarEstadoUsuario(usuario);
    }
  }
  
  actualizarEstadoUsuario(usuario: Usuario): void {
    this.usuariosService.updateUsuario(usuario.id, { estado: usuario.estado }).subscribe({
      next: () => {
        this.message.success(`Usuario ${usuario.estado === 'Activo' ? 'activado' : 'inactivado'} correctamente`);
        this.cargarUsuarios(); // Recargar lista de usuarios
      },
      error: () => {
        this.message.error('Error al actualizar el estado del usuario');
      }
    });
  }

  private limpiarEstadoTransferencia(): void {
    this.bienes = [];
    this.seleccionarTodos = false;
    this.usuarioDestino = null;
    this.transfiriendoBienes = false;
    this.cargandoBienes = false;
    this.limpiarFiltrosMovimiento();
  }

  private normalizarTexto(valor: unknown): string {
    return String(valor ?? '').trim().toLowerCase();
  }

}
