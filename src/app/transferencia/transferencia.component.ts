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
import { NzButtonModule } from 'ng-zorro-antd/button';
import { RouterModule } from '@angular/router';
import { TipoModalidadService } from '../services/tipo-modalidad.service';
import { TipoModalidad } from '../models/tipo-modalidad';
import { forkJoin, Observable, of, switchMap } from 'rxjs';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { Detalle } from '../models/detalle';
import { Categoria } from '../models/categoria';
import { CategoriaService } from '../services/categoria.service';
import { NzInputModule } from 'ng-zorro-antd/input';
import { DetalleService } from '../services/detalle.service';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { UsuarioService } from '../services/usuario.service';
import { Usuario } from '../models/usuario';
import { TransferenciaPresenterService } from '../services/transferencia-presenter.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DocumentoConfig, DocumentoConfigService } from '../services/documento-config.service';
import { LogVisitaService } from '../services/log-visita.service';




@Component({
  selector: 'app-transferencia',
  templateUrl: './transferencia.component.html',
  styleUrls: ['./transferencia.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, NzSelectModule, NzFormModule, NzButtonModule, NzMessageModule, RouterModule,NzStepsModule,NzInputModule,NzDatePickerModule]
})
export class TransferenciaComponent implements OnInit {
[x: string]: any;


  modalidades: Modalidad[] = [];
  ubicaciones: Ubicacion[] = [];
  ambientes: Ambiente[] = [];
  ambientesCecomp: Ambiente[] = [];
  bienesSeleccionados: Bien[] = [];
  modalidad: Modalidad = new Modalidad();
  selectedUbicacionProcedente: number | null = null;
  selectedUbicacionDestino: number | null = null;
  selectedAmbienteDestino: number | null = null;
  selectedMotivo: string = '';
  selectedTipoModalidad: number | null = null; // Cambia el tipo aquí
  bienes: Bien[] = [];
  bienesFiltrados: Bien[] = [];
  cargandoBienes = false;
  errorBienes = '';
  guardandoTransferencia = false;
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
  private cecompUbicacionId: number | null = null;
  private patrimonioUbicacionId: number | null = null;
  private sinUsuarioId: number | null = null;
  private patrimonioId: number | null = null;
  private documentoConfig: DocumentoConfig;


  
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
    private detalleservice: DetalleService,
    private usuarioService: UsuarioService,
    private presenter: TransferenciaPresenterService,
    private documentoConfigService: DocumentoConfigService,
    private logVisitaService: LogVisitaService,
    private message: NzMessageService

  ) {
    this.documentoConfig = this.documentoConfigService.getConfig();
  }


  
  ngOnInit(): void {
    this.documentoConfig = this.documentoConfigService.getConfig();
    this.loadModalidades();
    this.loadUbicaciones();
    this.loadBienes();
    this.loadTipoModalidades();
    this.loadCategorias();
    this.loadUsuariosRegistrados();

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
        this.sinUsuarioId = usuarios.find(usuario => this.usuarioService.esUsuarioSinUsuario(usuario))?.id || null;
        this.patrimonioId = usuarios.find(usuario => this.usuarioService.esUsuarioPatrimonio(usuario))?.id || null;
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
      ubicaciones => {
        this.ubicaciones = ubicaciones;
        this.cecompUbicacionId = this.getCecompUbicacionId();
        this.patrimonioUbicacionId = this.getPatrimonioUbicacionId();
        this.filtrarBienesCecompInicial();
        if (this.esTransferenciaInterna()) {
          this.fijarDestinoCecomp();
        } else if (this.esDadoDeBaja()) {
          this.fijarDestinoPatrimonio();
        }
      },
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
    this.selectedAmbienteDestino = null;

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
    const bienesFiltrados = this.presenter.filtrarBienes(this.bienes, {
      searchTerm: this.searchTerm,
      selectedCategoria: this.selectedCategoria,
      ubicacionTerm: this.ubicacionTerm,
      ambienteTerm: this.ambienteTerm
    });

    this.bienesFiltrados = this.filtrarBienesDisponiblesMovimiento(bienesFiltrados);
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

  onAmbienteDestinoChange(): void {
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
      this.message.warning('No hay bienes seleccionados para mover.');
      return;
    }
  
    if (aFavoritos) {
      const nuevosBienes = seleccionados.filter(bien => !this.bienesSeleccionados.some(b => b.id === bien.id));
      if (nuevosBienes.length === 0) {
        this.message.info('Los bienes seleccionados ya estan en la lista de seleccionados.');
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
    this.message.error(message);
  }


  onStepChange(): void {
    if (!this.validarDatosGenerales()) {
      return;
    }

    if (this.esTransferenciaInterna()) {
      this.currentStep = 2; // Si es "Transferencia Interna", va al paso 2
    } else {
      this.currentStep = this.currentStep + 1; // Para otros casos, sigue al paso 1
    }
  }

  avanzarDesdeFirmas(): void {
    if (!this.validarFirmas()) {
      return;
    }

    this.currentStep = 2;
  }




  loadBienes(): void {
    this.cargandoBienes = true;
    this.errorBienes = '';
    this.bienService.getBienes().subscribe(
      (bienes: Bien[]) => {
        this.bienes = bienes;
        this.bienesFiltrados = [...this.bienes];
        this.bienes.forEach(bien => this.cargarMovimientos(bien));
        this.actualizarEstadosBienes();
        this.cargandoBienes = false;
      },
      error => {
        this.errorBienes = 'No se pudieron cargar los bienes disponibles.';
        this.cargandoBienes = false;
        this.handleError('Error al cargar bienes', error);
      }
    );
  }

  cargarMovimientos(bien: Bien): void {
    this.bienService.getMovimientosByBienId(bien.id).subscribe(
      (movimientos: Detalle[]) => {
        bien.movimientos = movimientos.sort((a, b) => b.id - a.id);
        this.actualizarEstadoBien(bien);
        if (this.ubicacionTerm) {
          this.buscarBienes();
        }
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
    if (this.esTransferenciaInterna()) {
      this.Nombre = '';
      this.selectedMotivo = '';
      this.documentoAutorizado = '';
      this.selectedUbicacionProcedente = null;
      this.fijarDestinoCecomp();
      this.filtrarBienesCecompInicial();
    } else if (this.esDadoDeBaja()) {
      this.fijarDestinoPatrimonio();
    }

    this.actualizarEstadosBienes();
  }
  esTransferenciaInterna(): boolean {
    return this.selectedTipoModalidad === 2;
  }

  esDadoDeBaja(): boolean {
    return this.selectedTipoModalidad === 4;
  }

  esDestinoOficinaBloqueado(): boolean {
    return this.esTransferenciaInterna() || this.esDadoDeBaja();
  }
  
  esEstadoEditable(): boolean {
    return !this.esDadoDeBaja();
  }

  getStepActual(): number {
    if (!this.esTransferenciaInterna()) {
      return this.currentStep;
    }

    if (this.currentStep === 2) {
      return 1;
    }

    if (this.currentStep === 3) {
      return 2;
    }

    return 0;
  }

  volverDesdeBienes(): void {
    this.currentStep = this.esTransferenciaInterna() ? 0 : 1;
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
    this.bienesFiltrados = this.filtrarBienesDisponiblesMovimiento(this.bienes);
  }

  moverSeleccionadosAFavoritos(): void {
    const nuevosSeleccionados = this.bienesFiltrados.filter(bien => this.selectedBienIds[bien.id]);
    this.bienesSeleccionados.push(...nuevosSeleccionados);
    this.actualizarBienesFiltrados();
    this.selectedBienIds = {}; // Reset selection after moving
  }
  

  avanzarAlPaso4(): void {
    this.actualizarBienesSeleccionados();

    if (this.bienesSeleccionados.length === 0) {
      this.message.warning('Selecciona al menos un bien.');
      return;
    }

    this.currentStep = 3;
  }

  getDescripcionBien(bien: Bien): string {
    return bien.DESCRIPCION || 'Sin descripcion';
  }

  getEstadoActual(bien: Bien): string {
    return bien.movimientos[0]?.ESTADO || 'Sin estado';
  }

  getUsuarioBien(bien: Bien): string {
    const usuario = bien.usuario as unknown;

    if (!usuario) {
      return String(bien.ID_USUARIO || 'Sin usuario');
    }

    if (typeof usuario === 'string') {
      return usuario || String(bien.ID_USUARIO || 'Sin usuario');
    }

    if (typeof usuario === 'object') {
      const datosUsuario = usuario as Partial<Usuario> & { nombre?: string; apellidos?: string };
      const nombreCompleto = `${datosUsuario.NOMBRES || datosUsuario.nombre || ''} ${datosUsuario.APELLIDOS || datosUsuario.apellidos || ''}`.trim();
      return nombreCompleto || datosUsuario.USU || String(datosUsuario.id || bien.ID_USUARIO || 'Sin usuario');
    }

    return String(usuario);
  }

  getUbicacionActual(bien: Bien): string {
    return bien.movimientos[0]?.ambiente?.ubicacion?.NOMBRE || 'Sin ubicacion';
  }

  getAmbienteActual(bien: Bien): string {
    return bien.movimientos[0]?.ambiente?.NOMBRE_AMBIENTE || 'Sin ambiente';
  }

  private getAmbienteActualId(bien: Bien): number | null {
    return bien.movimientos[0]?.ID_AMBIENTE || bien.movimientos[0]?.ambiente?.ID_AMBIENTE || null;
  }

  private filtrarBienesDisponiblesMovimiento(bienes: Bien[]): Bien[] {
    return bienes.filter(bien => {
      const estaSeleccionado = this.bienesSeleccionados.some(seleccionado => seleccionado.id === bien.id);
      const estaEnDestino = Boolean(this.selectedAmbienteDestino) && this.getAmbienteActualId(bien) === this.selectedAmbienteDestino;

      return !estaSeleccionado && !estaEnDestino;
    });
  }

  getAmbienteDestinoNombre(): string {
    return this.ambientes.find(ambiente => ambiente.ID_AMBIENTE === this.selectedAmbienteDestino)?.NOMBRE_AMBIENTE || 'Sin destino';
  }

  getAmbientesDestino(): Ambiente[] {
    return this.esTransferenciaInterna() ? this.ambientesCecomp : this.ambientes;
  }

  getUbicacionesDestino(): Ubicacion[] {
    if (this.esTransferenciaInterna() && this.cecompUbicacionId) {
      return this.ubicaciones.filter(ubicacion => ubicacion.ID_UBICACION === this.cecompUbicacionId);
    }

    if (this.esDadoDeBaja() && this.patrimonioUbicacionId) {
      return this.ubicaciones.filter(ubicacion => ubicacion.ID_UBICACION === this.patrimonioUbicacionId);
    }

    return this.ubicaciones;
  }

  private getCecompUbicacionId(): number | null {
    const keyword = this.documentoConfig.ubicacionCecomp.toLowerCase();
    const cecomp = this.ubicaciones.find(ubicacion => {
      const nombre = `${ubicacion.NOMBRE || ''} ${ubicacion.CODIGO || ''}`.toLowerCase();
      return nombre.includes(keyword);
    });

    return cecomp?.ID_UBICACION || null;
  }

  private getPatrimonioUbicacionId(): number | null {
    const patrimonio = this.ubicaciones.find(ubicacion => this.contienePatrimonio(`${ubicacion.NOMBRE || ''} ${ubicacion.CODIGO || ''}`));

    return patrimonio?.ID_UBICACION || null;
  }

  private fijarDestinoCecomp(): void {
    if (!this.cecompUbicacionId) {
      return;
    }

    this.selectedUbicacionDestino = this.cecompUbicacionId;
    this.ambienteService.getAmbientesByUbicacion(this.cecompUbicacionId).subscribe(
      ambientes => {
        this.ambientesCecomp = ambientes;
        this.ambientes = ambientes;
        if (!ambientes.some(ambiente => ambiente.ID_AMBIENTE === this.selectedAmbienteDestino)) {
          this.selectedAmbienteDestino = null;
        }
      },
      error => this.handleError('Error al cargar ambientes de CECOMP', error)
    );
  }

  private fijarDestinoPatrimonio(): void {
    if (this.patrimonioUbicacionId) {
      this.selectedUbicacionDestino = this.patrimonioUbicacionId;
      this.ambienteService.getAmbientesByUbicacion(this.patrimonioUbicacionId).subscribe(
        ambientes => {
          this.ambientes = ambientes;
          this.selectedAmbienteDestino = this.getAmbientePatrimonioId(ambientes) || ambientes[0]?.ID_AMBIENTE || null;
        },
        error => this.handleError('Error al cargar ambientes de Patrimonio', error)
      );
      return;
    }

    this.ambienteService.getAmbientes().subscribe(
      ambientes => {
        const ambientePatrimonio = ambientes.find(ambiente => this.contienePatrimonio(ambiente.NOMBRE_AMBIENTE));

        if (!ambientePatrimonio) {
          this.selectedUbicacionDestino = null;
          this.selectedAmbienteDestino = null;
          this.ambientes = [];
          return;
        }

        this.patrimonioUbicacionId = ambientePatrimonio.ID_UBICACION;
        this.selectedUbicacionDestino = ambientePatrimonio.ID_UBICACION;
        this.ambientes = ambientes.filter(ambiente => ambiente.ID_UBICACION === ambientePatrimonio.ID_UBICACION);
        this.selectedAmbienteDestino = ambientePatrimonio.ID_AMBIENTE;
      },
      error => this.handleError('Error al buscar ambiente de Patrimonio', error)
    );
  }

  private getAmbientePatrimonioId(ambientes: Ambiente[]): number | null {
    return ambientes.find(ambiente => this.contienePatrimonio(ambiente.NOMBRE_AMBIENTE))?.ID_AMBIENTE || null;
  }

  private contienePatrimonio(value: string): boolean {
    return value.toLowerCase().includes('patrimonio');
  }

  private filtrarBienesCecompInicial(): void {
    if (!this.cecompUbicacionId) {
      return;
    }

    this.ubicacionTerm = this.ubicaciones.find(ubicacion => ubicacion.ID_UBICACION === this.cecompUbicacionId)?.NOMBRE || this.documentoConfig.ubicacionCecomp;
    this.buscarBienes();
  }

  guardarTransferencia(): void {
    
    if (this.bienesSeleccionados.length === 0) {
        this.message.warning('Por favor, selecciona al menos un bien para transferir.');
        return;
    }

    if (!this.validarDatosGenerales() || !this.validarFirmas()) {
        return;
    }

    const fechaMovimiento = this.presenter.normalizeDate(this.fechaMovimiento) || new Date();
    this.guardandoTransferencia = true;

    if (this.esTransferenciaInterna()) {
        const modalidadInterna = this.presenter.crearModalidad({
            nombre: this.documentoConfig.nombreInterno,
            fechaMovimiento,
            motivo: this.documentoConfig.motivoInterno,
            documentoAutorizado: this.documentoConfig.documentoInterno,
            tipoModalidadId: this.selectedTipoModalidad,
            ubicacionProcedenteId: this.cecompUbicacionId,
            ambienteDestinoId: this.selectedAmbienteDestino,
            personas: {
                personaRecibe: '',
                cargoRecibe: '',
                personaEntrega: '',
                cargoEntrega: '',
                personaControl: '',
                cargoControl: ''
            }
        });

        const estadosActuales = this.bienesSeleccionados.reduce((estados, bien) => ({
            ...estados,
            [bien.id]: this.selectedEstado[bien.id] || this.getEstadoActual(bien)
        }), {} as { [key: number]: string });

        this.modalidadService.crearModalidad(modalidadInterna).subscribe(
            response => {
                this.modalidadService.addBienes(
                    response.id,
                    this.bienesSeleccionados,
                    this.selectedAmbienteDestino!,
                    estadosActuales
                ).subscribe(
                    async () => {
                        await this.generarPDFMovimientoInterno(fechaMovimiento);
                        this.logVisitaService.registrarAccion('registrar movimiento interno', '/transferencia', {
                          modalidad_id: response.id,
                          ambiente_destino_id: this.selectedAmbienteDestino,
                          cantidad_bienes: this.bienesSeleccionados.length,
                          bienes_ids: this.bienesSeleccionados.map(bien => bien.id)
                        }).subscribe();
                        this.guardandoTransferencia = false;
                        this.message.success('Movimiento interno registrado correctamente');
                        this.router.navigate(['/reportes']);
                    },
                    error => {
                      this.guardandoTransferencia = false;
                      this.handleError('Error al registrar los bienes movidos', error);
                    }
                );
            },
            error => {
              this.guardandoTransferencia = false;
              this.handleError('Error al crear el registro interno', error);
            }
        );
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
        this.message.warning('Por favor, completa todos los campos de persona y cargo.');
        this.guardandoTransferencia = false;
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
            ).pipe(
                switchMap(() => this.actualizarUsuariosFueraCecomp())
            ).subscribe(
                () => {
                    this.logVisitaService.registrarAccion('registrar transferencia de bienes', '/transferencia', {
                      modalidad_id: response.id,
                      tipo_modalidad_id: this.selectedTipoModalidad,
                      ubicacion_procedente_id: this.selectedUbicacionProcedente,
                      ambiente_destino_id: this.selectedAmbienteDestino,
                      cantidad_bienes: this.bienesSeleccionados.length,
                      bienes_ids: this.bienesSeleccionados.map(bien => bien.id)
                    }).subscribe();
                    this.guardandoTransferencia = false;
                    this.message.success('Documento de transferencia generado correctamente');
                    this.router.navigate(['/reportes']);
                },
                error => {
                  this.guardandoTransferencia = false;
                  this.handleError('Error al agregar los bienes a la modalidad', error);
                }
            );
        },
        error => {
          this.guardandoTransferencia = false;
          this.handleError('Error al guardar la transferencia', error);
        }
    );
}

  private actualizarUsuariosFueraCecomp(): Observable<unknown> {
    if (!this.esDestinoFueraCecomp()) {
      return of(null);
    }

    const actualizaciones = this.bienesSeleccionados
      .map(bien => {
        const usuarioDestinoId = this.getUsuarioDestinoFueraCecomp(bien);

        if (!usuarioDestinoId || bien.ID_USUARIO === usuarioDestinoId) {
          return null;
        }

        return this.bienService.updateBien({
          ...bien,
          ID_USUARIO: usuarioDestinoId
        });
      })
      .filter((actualizacion): actualizacion is Observable<Bien> => actualizacion !== null);

    return actualizaciones.length ? forkJoin(actualizaciones) : of(null);
  }

  private esDestinoFueraCecomp(): boolean {
    return Boolean(
      this.selectedUbicacionDestino &&
      this.cecompUbicacionId &&
      this.selectedUbicacionDestino !== this.cecompUbicacionId
    );
  }

  private getUsuarioDestinoFueraCecomp(bien: Bien): number | null {
    const estadoFinal = this.selectedEstado[bien.id] || this.getEstadoActual(bien);
    const fueDadoDeBaja = estadoFinal.toLowerCase() === 'raee/chatarra';

    return fueDadoDeBaja ? this.patrimonioId : this.sinUsuarioId;
  }

  private validarDatosGenerales(): boolean {
    if (!this.selectedTipoModalidad) {
      this.message.warning('Selecciona el tipo de modalidad.');
      return false;
    }

    if (!this.fechaMovimiento) {
      this.message.warning('Selecciona la fecha de la transferencia.');
      return false;
    }

    if (!this.selectedUbicacionDestino) {
      this.message.warning('Selecciona la oficina destino.');
      return false;
    }

    if (!this.selectedAmbienteDestino) {
      this.message.warning('Selecciona el ambiente destino.');
      return false;
    }

    if (!this.esTransferenciaInterna()) {
      if (!this.Nombre.trim()) {
        this.message.warning('Ingresa el nombre del documento.');
        return false;
      }

      if (!this.selectedMotivo.trim()) {
        this.message.warning('Ingresa el motivo de la transferencia.');
        return false;
      }

      if (!this.documentoAutorizado.trim()) {
        this.message.warning('Ingresa el documento de autorizacion.');
        return false;
      }

      if (!this.selectedUbicacionProcedente) {
        this.message.warning('Selecciona la oficina procedente.');
        return false;
      }
    }

    return true;
  }

  private validarFirmas(): boolean {
    if (this.esTransferenciaInterna()) {
      return true;
    }

    const personas = {
      personaRecibe: this.personaRecibe,
      cargoRecibe: this.cargoRecibe,
      personaEntrega: this.personaEntrega,
      cargoEntrega: this.cargoEntrega,
      personaControl: this.personaControl,
      cargoControl: this.cargoControl
    };

    if (!this.presenter.tienePersonasCompletas(personas)) {
      this.message.warning('Completa los nombres y cargos de las personas encargadas.');
      return false;
    }

    return true;
  }

  private async generarPDFMovimientoInterno(fechaMovimiento: Date): Promise<void> {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const logo = await this.loadImage('cecomp.png');
    const ubicacion = this.ubicaciones.find(item => item.ID_UBICACION === this.cecompUbicacionId)?.NOMBRE || this.documentoConfig.ubicacionCecomp;
    const ambienteDestino = this.getAmbienteDestinoNombre();

    if (logo) {
      doc.addImage(logo, 'PNG', 16, 15, 30, 15);
    }

    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.text(this.documentoConfig.institucion, 52, 18);
    doc.text(this.documentoConfig.dependencia, 52, 24);

    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    doc.text(this.documentoConfig.tituloMovimientoInterno, 105, 44, { align: 'center' });

    doc.setFont('times', 'normal');
    this.drawPdfField(doc, 'Ubicacion:', ubicacion, 16, 55, 68);
    this.drawPdfField(doc, 'Ambiente:', ambienteDestino, 16, 65, 68);
    this.drawPdfField(doc, 'Categoria:', 'Todas', 112, 55, 64);
    this.drawPdfField(doc, 'Fecha:', fechaMovimiento.toLocaleDateString('es-PE'), 112, 65, 64);
    this.drawPdfField(doc, 'Total:', String(this.bienesSeleccionados.length), 112, 75, 64);

    autoTable(doc, {
      startY: 92,
      head: [['Codigo Patrimonial', 'Categoria', 'Detalle Tecnico de los Bienes', 'Estado']],
      body: this.bienesSeleccionados.map(bien => [
        String(bien.codigo || ''),
        this.wrapPdfCellText(doc, this.getCategoriaBienNombre(bien), 18),
        this.wrapPdfCellText(doc, this.getDetalleTecnicoBien(bien), 98),
        this.selectedEstado[bien.id] || this.getEstadoActual(bien)
      ]),
      theme: 'grid',
      styles: {
        font: 'times',
        fontSize: 8.2,
        cellPadding: 2.2,
        lineColor: [60, 60, 60],
        lineWidth: 0.15,
        overflow: 'linebreak',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [211, 47, 47],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 26, halign: 'center' },
        1: { cellWidth: 22, overflow: 'linebreak' },
        2: { cellWidth: 108, overflow: 'linebreak' },
        3: { cellWidth: 22, halign: 'center' }
      },
      margin: { left: 16, right: 16, bottom: 16 }
    });

    const totalPages = doc.getNumberOfPages();
    for (let page = 1; page <= totalPages; page++) {
      doc.setPage(page);
      doc.setFontSize(8);
      doc.text(`Pagina ${page} de ${totalPages}`, 194, 291, { align: 'right' });
    }

    doc.save('movimiento-interno-cecomp.pdf');
  }

  private drawPdfField(doc: jsPDF, label: string, value: string, x: number, y: number, width: number): void {
    doc.setFont('times', 'bold');
    doc.setFontSize(8.8);
    doc.text(label, x, y + 4.5);
    doc.rect(x + 26, y, width, 8);
    doc.setFont('times', 'normal');
    doc.setFontSize(8.8);
    doc.text(doc.splitTextToSize(value || '-', width - 4).slice(0, 1), x + 28, y + 5.3);
  }

  private loadImage(src: string): Promise<HTMLImageElement | undefined> {
    return new Promise(resolve => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = () => resolve(undefined);
      image.src = src;
    });
  }

  private getDetalleTecnicoBien(bien: Bien): string {
    return [
      bien.DESCRIPCION,
      bien.DIMENSION ? `Dimension: ${bien.DIMENSION}` : '',
      bien.MODELO ? `Modelo: ${bien.MODELO}` : '',
      bien.NUMERO_SERIE ? `Serie: ${bien.NUMERO_SERIE}` : '',
      bien.TIPO ? `Tipo: ${bien.TIPO}` : '',
      bien.COLOR ? `Color: ${bien.COLOR}` : ''
    ].filter(Boolean).join(' | ');
  }

  private getCategoriaBienNombre(bien: Bien): string {
    return bien.categoria?.NOMBRE_CATEGORIA ||
      this.categorias.find(categoria => categoria.id === bien.ID_CATEGORIA)?.NOMBRE_CATEGORIA ||
      'Sin categoria';
  }

  private wrapPdfCellText(doc: jsPDF, value: string, width: number): string {
    return doc.splitTextToSize((value || '').replace(/\s+/g, ' ').trim(), width).join('\n');
  }
}

