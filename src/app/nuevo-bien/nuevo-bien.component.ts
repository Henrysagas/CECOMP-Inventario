import { Component, OnInit } from '@angular/core';
import { BienService } from '../services/bien.service';
import { CategoriaService } from '../services/categoria.service';  
import { UbicacionService } from '../services/ubicacion.service';  
import { AmbienteService } from '../services/ambiente.service';  
import { UsuarioService } from '../services/usuario.service';  
import { DetalleService } from '../services/detalle.service';  
import { Router } from '@angular/router'; 

import { Detalle } from '../models/detalle';
import { Bien } from '../models/bien';
import { Usuario } from '../models/usuario'; 
import { Categoria } from '../models/categoria';
import { Ubicacion } from '../models/ubicacion';
import { Ambiente } from '../models/ambiente';
import { FormsModule } from '@angular/forms';  
import { CommonModule } from '@angular/common';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { LogVisitaService } from '../services/log-visita.service';

@Component({
  selector: 'app-nuevo-bien',
  templateUrl: './nuevo-bien.component.html',
  styleUrls: ['./nuevo-bien.component.css'],
  standalone: true, 
  imports: [
    FormsModule, 
    CommonModule,
    NzMessageModule
  ]
})
export class AgregarBienComponent implements OnInit {

  categoriaPredeterminada: Categoria = new Categoria(0, 'Defecto');  
  nuevoBien: Bien = new Bien(0, 0, 0, 0, '', '', '', '', '', '', '', this.categoriaPredeterminada, [], '');
  usuariosAdministradores: Usuario[] = []; 
  categorias: Categoria[] = [];  
  ubicaciones: Ubicacion[] = [];  
  ambientes: Ambiente[] = [];  
  estados: string[] = ['Nuevo', 'Bueno', 'Regular', 'Malo',"RAEE/Chatarra"]; 
  selectedUbicacionId: number | null = null;
  selectedAmbienteId: number | null = null;
  selectedEstado: string | null = null;
  showAmbienteSelect: boolean = false;

  constructor(
    private bienService: BienService,
    private usuarioService: UsuarioService,
    private categoriaService: CategoriaService,
    private ubicacionService: UbicacionService,  
    private ambienteService: AmbienteService,  
    private detalleService: DetalleService, 
    private router: Router,
    private logVisitaService: LogVisitaService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.cargarUsuariosAdministradores(); 
    this.cargarCategorias();  
    this.cargarUbicaciones();  
  }

  cargarUsuariosAdministradores(): void {
    this.usuarioService.getUsuariosAsignablesBienes().subscribe(
      (usuarios: Usuario[]) => {
        this.usuariosAdministradores = usuarios;
        const usuarioSinUsuario = usuarios.find(usuario => this.usuarioService.esUsuarioSinUsuario(usuario));

        if (usuarioSinUsuario) {
          this.nuevoBien.ID_USUARIO = usuarioSinUsuario.id;
        }
      },
      error => {
        console.error('Error al cargar usuarios asignables:', error);
      }
    );
  }

  cargarCategorias(): void {
    this.categoriaService.getCategorias().subscribe(
      (categorias: Categoria[]) => {
        this.categorias = categorias;
      },
      error => {
        console.error('Error al cargar categorías:', error);
      }
    );
  }

  cargarUbicaciones(): void {
    this.ubicacionService.getUbicaciones().subscribe(
      (ubicaciones: Ubicacion[]) => {
        this.ubicaciones = ubicaciones;
      },
      error => {
        console.error('Error al cargar ubicaciones:', error);
      }
    );
  }

  onUbicacionChange(event: any): void {
    this.showAmbienteSelect = false;
    this.selectedAmbienteId = null;
    this.buscarAmbientes(); 
  }

  buscarAmbientes(): void {
    if (this.selectedUbicacionId) {
      this.ambienteService.getAmbientesByUbicacion(this.selectedUbicacionId).subscribe(
        (ambientes: Ambiente[]) => {
          this.ambientes = ambientes;
          this.showAmbienteSelect = true; 
        },
        error => {
          console.error('Error al obtener ambientes:', error);
        }
      );
    }
  }

  guardarBien(): void {
    if (!this.selectedAmbienteId || !this.selectedEstado) {
      this.message.warning('Por favor completa los campos obligatorios.');
      return;
    }
    
    if(this.nuevoBien.DESCRIPCION==""){
      this.nuevoBien.DESCRIPCION = " "
    }
    const movimiento = {
      ID_AMBIENTE: this.selectedAmbienteId!,
      ESTADO: this.selectedEstado!
    };
  
    this.bienService.createBienConMovimiento(this.nuevoBien, movimiento).subscribe(
      (response) => {
        this.logVisitaService.registrarAccion('agregar bien', '/nuevo-bien', {
          bien_id: response?.id ?? response?.ID ?? this.nuevoBien.id,
          codigo: this.nuevoBien.codigo,
          categoria_id: this.nuevoBien.ID_CATEGORIA,
          usuario_id: this.nuevoBien.ID_USUARIO,
          ambiente_id: this.selectedAmbienteId,
          estado: this.selectedEstado
        }).subscribe();
        this.message.success('Bien y movimiento inicial guardados correctamente.');
        this.resetForm();
        this.router.navigate(['/bienes']);
      },
      (error) => {
        console.error('Error al guardar el bien y el movimiento:', error);
        this.message.error('Hubo un problema al guardar el bien. Intenta nuevamente.');
      }
    );
  }
  
  

  resetForm(): void {
    const categoriaPredeterminada: Categoria = new Categoria(0, 'Defecto'); 
    this.nuevoBien =  new Bien(0,0, 0, 0, '', '', '', '', '', '', '', this.categoriaPredeterminada, [], '');
    const usuarioSinUsuario = this.usuariosAdministradores.find(usuario => this.usuarioService.esUsuarioSinUsuario(usuario));

    if (usuarioSinUsuario) {
      this.nuevoBien.ID_USUARIO = usuarioSinUsuario.id;
    }

    this.selectedUbicacionId = null;
    this.selectedAmbienteId = null;
    this.selectedEstado = null;
    this.showAmbienteSelect = false;
  }

  cancelar(): void {
    // Redirige al listado de bienes al cancelar
    this.router.navigate(['/bienes']);
  }
}
