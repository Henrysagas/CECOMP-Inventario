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

@Component({
  selector: 'app-nuevo-bien',
  templateUrl: './nuevo-bien.component.html',
  styleUrls: ['./nuevo-bien.component.css'],
  standalone: true, 
  imports: [
    FormsModule, 
    CommonModule
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
    private router: Router 
  ) {}

  ngOnInit(): void {
    this.cargarUsuariosAdministradores(); 
    this.cargarCategorias();  
    this.cargarUbicaciones();  
  }

  cargarUsuariosAdministradores(): void {
    this.usuarioService.getUsuariosConRolAdmin().subscribe(
      (usuarios: Usuario[]) => {
        console.log('Usuarios Administradores:', usuarios);  // Verifica si solo son administradores
        this.usuariosAdministradores = usuarios;
      },
      error => {
        console.error('Error al cargar administradores:', error);
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
    console.log('Datos a enviar:', this.nuevoBien);  // Para ver los datos que estás enviando
  
    if (!this.selectedAmbienteId || !this.selectedEstado) {
      alert('Por favor completa los campos obligatorios.');
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
        console.log('Bien y movimiento guardados con éxito:', response);
        alert('Bien y movimiento inicial guardados con éxito.');
        this.resetForm();
        this.router.navigate(['/bienes']);
      },
      (error) => {
        console.error('Error al guardar el bien y el movimiento:', error);  // Log detallado del error
        alert('Hubo un problema al guardar el bien. Intenta nuevamente.');
      }
    );
  }
  
  

  resetForm(): void {
    const categoriaPredeterminada: Categoria = new Categoria(0, 'Defecto'); 
    this.nuevoBien =  new Bien(0,0, 0, 0, '', '', '', '', '', '', '', this.categoriaPredeterminada, [], '');
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
