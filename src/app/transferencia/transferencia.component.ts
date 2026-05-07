import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { BienService } from '../services/bien.service';
import { ModalidadService } from '../services/modalidad.service';
import { UbicacionService } from '../services/ubicacion.service';
import { AmbienteService } from '../services/ambiente.service';
import { Modalidad } from '../models/modalidad';
import { Ubicacion } from '../models/ubicacion';
import { Bien } from '../models/bien';
import { Ambiente } from '../models/ambiente';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { ChangeDetectorRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TipoModalidadService } from '../services/tipo-modalidad.service';
import { TipoModalidad } from '../models/tipo-modalidad';
import { debounceTime, Subject } from 'rxjs';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { Detalle } from '../models/detalle';
import { Categoria } from '../models/categoria';
import { CategoriaService } from '../services/categoria.service';
import { NzInputModule } from 'ng-zorro-antd/input';
import { DetalleService } from '../services/detalle.service';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { UsuarioService } from '../services/usuario.service';
import { Usuario } from '../models/usuario';
import { TransferenciaPresenterService } from '../services/transferencia-presenter.service';




@Component({
  selector: 'app-transferencia',
  templateUrl: './transferencia.component.html',
  styleUrls: ['./transferencia.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, NzSelectModule, NzFormModule, RouterModule,NzStepsModule,NzInputModule,NzDatePickerModule]
})
export class TransferenciaComponent implements OnInit {
[x: string]: any;


  modalidades: Modalidad[] = [];
  ubicaciones: Ubicacion[] = [];
  ambientes: Ambiente[] = [];
  bienesSeleccionados: Bien[] = [];
  modalidad: Modalidad = new Modalidad();
  selectedUbicacionProcedente: number | null = null;
  selectedUbicacionDestino: number | null = null;
  selectedAmbienteDestino: number | null = null;
  selectedMotivo: string = '';
  selectedTipoModalidad: number | null = null; // Cambia el tipo aquí
  bienes: Bien[] = [];
  bienesFiltrados: Bien[] = [];  
  searchTerm: string = ''; // Variable para la búsqueda
  bienesSeleccionadosFiltrados: Bien[] = [];
  searchTermSeleccionados: string = ''; // Variable para la búsqueda de bienes seleccionados
  selectedBienIds: { [key: number]: boolean } = {};
  documentoAutorizado: string = '';
  tipoModalidades: TipoModalidad[] = [];
  personas: any;
  usuariosRegistrados: Usuario[] = [];

  selectedEstado: { [key: number]: string } = {};
  fechaMovimiento: Date | null = new Date();
  cargoControl: string = '';
  personaControl: string = '';
  selectedUsuarioControl: number | null = null;
  cargoEntrega: string = '';
  personaEntrega: string = '';
  selectedUsuarioEntrega: number | null = null;
  cargoRecibe: string = '';
  personaRecibe: string = '';
  selectedUsuarioRecibe: number | null = null;
  currentStep: number = 0;

  //Filtros de busqueda
  categorias: Categoria[] = [];
  categoriaManual: string = '';
  ubicacionTerm: string = '';
  ambienteTerm: string = '';
  manualCategoria: boolean = false;
  selectedCategoria: any = null;


  
  private searchSubject = new Subject<string>();
    Nombre: string = ''; // Agregar esta línea
modoManual: any;
selectedNombre: any;


  constructor(
    private modalidadService: ModalidadService,
    private ubicacionService: UbicacionService,
    private ambienteService: AmbienteService,
    private bienService: BienService,
    private tipoModalidadService: TipoModalidadService,
    private categoriaService: CategoriaService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private detalleservice: DetalleService,
    private usuarioService: UsuarioService,
    private presenter: TransferenciaPresenterService,

  ) {}


  
  ngOnInit(): void {
    this.loadModalidades();
    this.loadUbicaciones();
    this.loadBienes();
    this.loadTipoModalidades();
    this.loadCategorias();
    this.loadUsuariosRegistrados();

    this.searchSubject.pipe(debounceTime(300)).subscribe(term => {
      this.buscarBienes();
    });
    this.actualizarBienesFiltrados();
  }


  loadCategorias(): void {
    this.categoriaService.getCategorias().subscribe(
      (data: Categoria[]) => {
        this.categorias = data;
      },
      (error) => {
        console.error('Error al obtener las categorías:', error);
      }
    );
  }

  loadUsuariosRegistrados(): void {
    this.usuarioService.getUsuarios().subscribe(
      (usuarios: Usuario[]) => {
        this.usuariosRegistrados = usuarios.filter(usuario => usuario.estado !== 'Inactivo');
      },
      error => this.handleError('Error al cargar usuarios registrados', error)
    );
  }

  loadModalidades(): void {
    this.modalidadService.getModalidades().subscribe(
      data => this.modalidades = data,
      error => this.handleError('Error al cargar modalidades', error)
    );
  }

  loadUbicaciones(): void {
    this.ubicacionService.getUbicaciones().subscribe(
      ubicaciones => this.ubicaciones = ubicaciones,
      error => this.handleError('Error al cargar ubicaciones', error)
    );
  }



  loadTipoModalidades(): void {
    this.tipoModalidadService.getTiposModalidad().subscribe(
      tipos => this.tipoModalidades = tipos,
      error => this.handleError('Error al cargar tipos de modalidad', error)
    );
  }

  onUbicacionDestinoChange(): void {
    if (this.selectedUbicacionDestino) {
      this.ambienteService.getAmbientesByUbicacion(this.selectedUbicacionDestino).subscribe(
        ambientes => this.ambientes = ambientes,
        error => this.handleError('Error al obtener los ambientes', error)
      );
    }
  }
  

  toggleSelectAll(event: any): void {
    const checked = event.target.checked;
    this.selectedBienIds = this.presenter.seleccionarTodos(this.bienesFiltrados, checked, this.selectedBienIds);
    this.actualizarBienesSeleccionados();
  }

 
  
  // Método para obtener el cargo correspondiente a un nombre (puedes adaptarlo)
  getCargoPorNombre(nombre: string): string {
    // Suponiendo que tienes una lista de personas y cargos relacionados
    const personaCargo = this['listaDePersonas'].find((persona: { nombre: string; }) => persona.nombre === nombre);
    return personaCargo ? personaCargo.cargo : '';
  }
  
  // Agregar un método para verificar el estado del Modo Manual
  isModoManual: boolean = false; // Esta variable se conecta a un checkbox en la vista
  
  // Método para activar/desactivar el Modo Manual
  toggleModoManual(): void {
    this.isModoManual = !this.isModoManual;
    // Si el modo manual se activa, actualiza la lista de nombres y cargos
    if (this.isModoManual) {
      this.personaRecibe = ''; // Resetea los campos
      this.personaEntrega = '';
      this.personaControl = '';
      this.selectedUsuarioRecibe = null;
      this.selectedUsuarioEntrega = null;
      this.selectedUsuarioControl = null;
    }
  }

  onUsuarioRegistradoChange(tipo: 'recibe' | 'entrega' | 'control', usuarioId: number | null): void {
    const usuario = this.usuariosRegistrados.find(item => item.id === usuarioId);
    const datosUsuario = this.presenter.obtenerDatosUsuario(usuario);

    if (!datosUsuario) {
      return;
    }

    if (tipo === 'recibe') {
      this.personaRecibe = datosUsuario.nombreCompleto;
      this.cargoRecibe = datosUsuario.cargo;
      return;
    }

    if (tipo === 'entrega') {
      this.personaEntrega = datosUsuario.nombreCompleto;
      this.cargoEntrega = datosUsuario.cargo;
      return;
    }

    this.personaControl = datosUsuario.nombreCompleto;
    this.cargoControl = datosUsuario.cargo;
  }

  

  actualizarFiltrados(): void {
    this.buscarBienes();
    this.buscarSeleccionados();
  }
  
  buscarBienes(): void {
    this.bienesFiltrados = this.presenter.filtrarBienes(this.bienes, {
      searchTerm: this.searchTerm,
      selectedCategoria: this.selectedCategoria,
      ubicacionTerm: this.ubicacionTerm,
      ambienteTerm: this.ambienteTerm
    });
  }

  onSearchTermChange(): void {
    this.buscarBienes();
  }

  onCategoriaChange(event: any): void {
    this.selectedCategoria = event;
    this.buscarBienes();
  }

  onUbicacionChange(): void {
    this.buscarBienes();
  }

  onAmbienteChange(): void {
    this.buscarBienes();
  }

  toggleManualCategoria(): void {
    this.manualCategoria = !this.manualCategoria;
    this.selectedCategoria = null;
    this.categoriaManual = '';
    this.buscarBienes();
  }

  buscarSeleccionados(): void {
    this.bienesSeleccionadosFiltrados = this.presenter.filtrarSeleccionados(
      this.bienesSeleccionados,
      this.searchTermSeleccionados
    );
  }

  moverFavoritosASeleccionados(): void {
    this.bienesSeleccionados = this.bienesSeleccionados.filter(bien => !this.selectedBienIds[bien.id]);
    this.actualizarBienesFiltrados();
    this.selectedBienIds = {};
  }

  
  private moverBienes(aFavoritos: boolean): void {
    const seleccionados = aFavoritos ? 
      this.bienesFiltrados.filter(bien => this.selectedBienIds[bien.id]) : 
      this.bienesSeleccionados.filter(bien => this.selectedBienIds[bien.id]);
  
    if (seleccionados.length === 0) {
      alert(`No hay bienes seleccionados para mover.`);
      return;
    }
  
    if (aFavoritos) {
      // Asegúrate de que solo se muevan bienes que no están ya en la lista de seleccionados
      const nuevosBienes = seleccionados.filter(bien => !this.bienesSeleccionados.some(b => b.id === bien.id));
      if (nuevosBienes.length === 0) {
        alert('Los bienes seleccionados ya están en la lista de seleccionados.');
        return;
      }
      this.bienesSeleccionados.push(...nuevosBienes);
      // Elimina los bienes seleccionados de la lista de bienes filtrados
      this.bienesFiltrados = this.bienesFiltrados.filter(bien => !this.selectedBienIds[bien.id]);
    } else {
      this.bienesSeleccionados = this.bienesSeleccionados.filter(bien => !this.selectedBienIds[bien.id]);
    }
  
    this.selectedBienIds = {}; // Resetear la selección
  
    // Actualiza las listas filtradas después de mover los bienes
    this.actualizarFiltrados();
  }
  
  goToPreviousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }
    goToNextStep() {
      if (this.currentStep < 1) {
        this.currentStep++;
      }
    }

  

  cancelarTransferencia(): void {
    this.router.navigate(['/reportes']);
  }

  private handleError(message: string, error: any): void {
    console.error(message, error);
    alert(message);
  }


  onStepChange(): void {
    if (this.selectedTipoModalidad === 2) {
      this.currentStep = 2; // Si es "Transferencia Interna", va al paso 2
    } else {
      this.currentStep = this.currentStep + 1; // Para otros casos, sigue al paso 1
    }
  }




  loadBienes(): void {
    this.bienService.getBienes().subscribe(
      (bienes: Bien[]) => {
        this.bienes = bienes;
        this.bienesFiltrados = [...this.bienes];
        this.bienes.forEach(bien => this.cargarMovimientos(bien));
        this.actualizarEstadosBienes();
      },
      error => this.handleError('Error al cargar bienes', error)
    );
  }

  cargarMovimientos(bien: Bien): void {
    this.bienService.getMovimientosByBienId(bien.id).subscribe(
      (movimientos: Detalle[]) => {
        bien.movimientos = movimientos.sort((a, b) => b.id - a.id);
        this.actualizarEstadoBien(bien);
      },
      error => this.handleError('Error al cargar movimientos', error)
    );
  }

  actualizarEstadoBien(bien: Bien): void {
    this.selectedEstado[bien.id] = this.presenter.obtenerEstadoBien(bien, this.selectedTipoModalidad);
  }

  private actualizarEstadosBienes(): void {
    this.bienes.forEach(bien => this.actualizarEstadoBien(bien));
  }

  onTipoModalidadChange(): void {
    this.actualizarEstadosBienes();
  }
  esTransferenciaInterna(): boolean {
    return this.selectedTipoModalidad === 2;
  }
  
  esEstadoEditable(): boolean {
    return this.selectedTipoModalidad !== 4;
  }

  toggleBienSeleccionado(bienId: number): void {
    this.selectedBienIds[bienId] = !this.selectedBienIds[bienId];
    this.actualizarBienesSeleccionados();
    this.actualizarBienesFiltrados();
  }
  actualizarBienesSeleccionados(): void {
    this.bienesSeleccionados = this.presenter.obtenerSeleccionados(this.bienes, this.selectedBienIds);
  }

  actualizarBienesFiltrados(): void {
    this.bienesFiltrados = this.presenter.obtenerDisponibles(this.bienes, this.bienesSeleccionados);
  }

  moverSeleccionadosAFavoritos(): void {
    const nuevosSeleccionados = this.bienesFiltrados.filter(bien => this.selectedBienIds[bien.id]);
    this.bienesSeleccionados.push(...nuevosSeleccionados);
    this.actualizarBienesFiltrados();
    this.selectedBienIds = {}; // Reset selection after moving
  }
  

  avanzarAlPaso4(): void {
    this.actualizarBienesSeleccionados();
    this.currentStep = 3;
  }

  guardarTransferencia(): void {
    
    if (this.bienesSeleccionados.length === 0) {
        alert('Por favor, selecciona al menos un bien para transferir.');
        return;
    }

    const fechaMovimiento = this.presenter.normalizeDate(this.fechaMovimiento) || new Date();

    if (this.selectedTipoModalidad === 2) {
        // Iterar sobre todos los bienes seleccionados
        this.bienesSeleccionados.forEach(bien => {
            const nuevoMovimiento = this.presenter.crearMovimientoInterno(
                bien.id,
                this.selectedAmbienteDestino!,
                this.selectedEstado[bien.id] || 'ERROR',
                fechaMovimiento
            );

            this.detalleservice.agregarMovimiento(bien.id,nuevoMovimiento).subscribe(
                () => console.log(`Movimiento agregado para bien ID: ${bien.id}`),
                error => this.handleError(`Error al agregar movimiento para bien ID: ${bien.id}`, error)
            );
        });

        alert('Movimientos registrados correctamente');
        return;
    }

    const personas = {
        personaRecibe: this.personaRecibe,
        cargoRecibe: this.cargoRecibe,
        personaEntrega: this.personaEntrega,
        cargoEntrega: this.cargoEntrega,
        personaControl: this.personaControl,
        cargoControl: this.cargoControl
    };

    // Si la modalidad no es 2, validamos los datos personales
    if (!this.presenter.tienePersonasCompletas(personas)) {
        alert('Por favor, completa todos los campos de persona y cargo.');
        return;
    }

    const nuevaModalidad = this.presenter.crearModalidad({
        nombre: this.Nombre,
        fechaMovimiento,
        motivo: this.selectedMotivo,
        documentoAutorizado: this.documentoAutorizado,
        tipoModalidadId: this.selectedTipoModalidad,
        ubicacionProcedenteId: this.selectedUbicacionProcedente,
        ambienteDestinoId: this.selectedAmbienteDestino,
        personas
    });

    this.modalidadService.crearModalidad(nuevaModalidad).subscribe(
        response => {
            this.modalidadService.addBienes(
                response.id, 
                this.bienesSeleccionados, 
                this.selectedAmbienteDestino!, 
                this.selectedEstado
            ).subscribe(
                () => {
                    alert('Documento de transferencia generado correctamente');
                    this.router.navigate(['/reportes']);
                },
                error => this.handleError('Error al agregar los bienes a la modalidad', error)
            );
        },
        error => this.handleError('Error al guardar la transferencia', error)
    );
}
}

