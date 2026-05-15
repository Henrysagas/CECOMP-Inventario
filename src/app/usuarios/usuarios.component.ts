import { Component, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { UsuarioService } from '../services/usuario.service';
import { Usuario } from '../models/usuario';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { BienService } from '../services/bien.service';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzInputModule } from 'ng-zorro-antd/input';
import { LogVisitaService } from '../services/log-visita.service';
import { RolUsuarioService } from '../services/rol-usuario.service';


@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [NzDescriptionsModule,FormsModule,CommonModule,NzSelectModule,NzTableModule,NzGridModule,
    RouterLink,NzButtonModule,
    NzIconModule,NzCheckboxModule,NzTabsModule,NzInputModule,NzModalModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  bienes: any[] = [];
  seleccionarTodos: boolean = false;
  usuarioDestino: number | null = null;
  usuarioOrigenId: number | null = null;
  rolFiltro: number | null = null;
  estadoFiltro: 'activos' | 'inactivos' | 'todos' = 'activos';
  transfiriendoBienes = false;
  cargandoBienes = false;
  tabSeleccionado = 0;
  busquedaBienes = '';
  categoriaFiltro: number | null = null;
  estadoSeleccionFiltro: 'todos' | 'seleccionados' | 'pendientes' = 'todos';
  usuarioEditando: Partial<Usuario> | null = null;
  guardandoUsuario = false;

  roles: Array<{ id: number; nombre: string }> = [];

  get usuariosActivos(): Usuario[] {
    return this.usuarios.filter(u => u.estado !== 'Inactivo' && u.id !== this.usuarioOrigenId);
  }

  get usuariosFiltrados(): Usuario[] {
    return this.usuarios.filter(usuario => {
      const coincideRol = !this.rolFiltro || usuario.ID_ROL === this.rolFiltro;
      const esInactivo = usuario.estado === 'Inactivo';
      const coincideEstado =
        this.estadoFiltro === 'todos' ||
        (this.estadoFiltro === 'activos' && !esInactivo) ||
        (this.estadoFiltro === 'inactivos' && esInactivo);

      return coincideRol && coincideEstado;
    });
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
    private message: NzMessageService,
    private logVisitaService: LogVisitaService,
    private modal: NzModalService,
    private router: Router,
    private rolUsuarioService: RolUsuarioService
  ) {}

  ngOnInit(): void {
    this.cargarRoles();
    this.cargarUsuarios();
  }

  cargarRoles(): void {
    this.rolUsuarioService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles.map(rol => ({
          id: rol.ID_ROL_USUARIO,
          nombre: rol.NOMBRE_ROL
        }));
      },
      error: () => {
        this.message.error('Error al cargar roles');
      }
    });
  }

  cargarUsuarios(): void {
    this.usuariosService.getUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
      },
      error: () => {
        this.message.error('Error al cargar usuarios');
      }
    });
  }

  limpiarFiltrosUsuarios(): void {
    this.rolFiltro = null;
    this.estadoFiltro = 'activos';
  }

  prepararTransferenciaDesdeUsuario(idUsuario: number): void {
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

  onRolChange(usuario: Usuario): void {
    this.actualizarRol(usuario);
  }

  toggleMostrarEliminados(): void {
    this.cargarUsuarios();
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
      this.logVisitaService.registrarAccion('transferir bienes entre usuarios', '/usuarios', {
        usuario_origen_id: this.usuarioOrigenId,
        usuario_destino_id: this.usuarioDestino,
        cantidad_bienes: bienesSeleccionados.length,
        bienes_ids: bienesSeleccionados.map(bien => bien.id)
      }).subscribe();
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
        this.logVisitaService.registrarAccion('editar rol de usuario', '/usuarios', {
          usuario_id: usuario.id,
          rol_id: usuario.ID_ROL
        }).subscribe();
        this.message.success('Rol actualizado correctamente');
      },
      error: () => {
        this.message.error('Error al actualizar el rol');
      }
    });
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

  abrirEditarUsuario(usuario: Usuario): void {
    this.usuarioEditando = {
      id: usuario.id,
      ID_ROL: usuario.ID_ROL,
      NOMBRES: usuario.NOMBRES,
      APELLIDOS: usuario.APELLIDOS,
      USU: usuario.USU,
      dni: usuario.dni,
      cargo: usuario.cargo,
      estado: usuario.estado
    };
  }

  cancelarEdicionUsuario(): void {
    this.usuarioEditando = null;
    this.guardandoUsuario = false;
  }

  guardarUsuarioEditado(): void {
    if (!this.usuarioEditando?.id) {
      return;
    }

    if (!this.usuarioEditando.NOMBRES || !this.usuarioEditando.APELLIDOS || !this.usuarioEditando.USU) {
      this.message.warning('Completa nombres, apellidos y usuario.');
      return;
    }

    this.guardandoUsuario = true;
    const { id, NOMBRES, APELLIDOS, USU, dni, cargo, ID_ROL } = this.usuarioEditando;

    this.usuariosService.updateUsuario(id, { NOMBRES, APELLIDOS, USU, dni, cargo, ID_ROL }).subscribe({
      next: () => {
        this.logVisitaService.registrarAccion('editar usuario', '/usuarios', {
          usuario_id: id
        }).subscribe();
        this.message.success('Usuario actualizado correctamente');
        this.cancelarEdicionUsuario();
        this.cargarUsuarios();
      },
      error: () => {
        this.guardandoUsuario = false;
        this.message.error('Error al actualizar el usuario');
      }
    });
  }

  cambiarEstadoUsuario(usuario: Usuario): void {
    if (usuario.estado === 'Activo') {
      this.usuariosService.getBienesPorUsuario(usuario.id).subscribe({
        next: (bienes) => {
          if (bienes.length > 0) {
            this.message.error('No se puede inactivar un usuario con bienes asignados.');
          } else {
            this.modal.confirm({
              nzTitle: 'Inactivar usuario',
              nzContent: `El usuario ${usuario.USU} quedara inactivo. Deseas continuar?`,
              nzOkText: 'Inactivar',
              nzOkDanger: true,
              nzCancelText: 'Cancelar',
              nzOnOk: () => {
                usuario.estado = 'Inactivo';
                this.actualizarEstadoUsuario(usuario);
              }
            });
          }
        },
        error: () => {
          this.message.error('Error al verificar los bienes del usuario.');
        }
      });
    } else {
      this.modal.confirm({
        nzTitle: 'Activar usuario',
        nzContent: `El usuario ${usuario.USU} volvera a estar activo. Deseas continuar?`,
        nzOkText: 'Activar',
        nzCancelText: 'Cancelar',
        nzOnOk: () => {
          usuario.estado = 'Activo';
          this.actualizarEstadoUsuario(usuario);
        }
      });
    }
  }
  
  actualizarEstadoUsuario(usuario: Usuario): void {
    this.usuariosService.updateUsuario(usuario.id, { estado: usuario.estado }).subscribe({
      next: () => {
        this.logVisitaService.registrarAccion('editar estado de usuario', '/usuarios', {
          usuario_id: usuario.id,
          estado: usuario.estado
        }).subscribe();
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
