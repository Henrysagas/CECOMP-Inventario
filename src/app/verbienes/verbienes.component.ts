import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BienService } from '../services/bien.service';
import { CategoriaService } from '../services/categoria.service';
import { Bien } from '../models/bien';
import { Categoria } from '../models/categoria';
import { Detalle } from '../models/detalle';
import { Historial } from '../models/historial';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { BienesListadoService } from '../services/bienes-listado.service';

@Component({
  selector: 'app-verbienes',
  templateUrl: './verbienes.component.html',
  styleUrls: ['./verbienes.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NzTabsModule]
})
export class VerbienesComponent implements OnInit {
  categorias: Categoria[] = [];
  bienes: Bien[] = [];
  bienesFiltrados: Bien[] = [];
  cargandoBienes = false;
  errorBienes = '';
  paginaActual = 1;
  tamanioPagina = 5;
  idTerm = '';
  nombreTerm = '';
  categoriaManual = '';
  ambienteTerm = '';
  manualCategoria = false;
  selectedCategoria: any = null;
  fechaSeleccionada = '';
  ambientesInventario: string[] = [];

  bienesFueraInventario: Bien[] = [];
  bienesFueraFiltrados: Bien[] = [];
  paginaActualFuera = 1;
  tamanioPaginaFuera = 8;
  fechaSalidaInicio = '';
  fechaSalidaFin = '';
  searchTermFuera = '';
  ubicacionTermFuera = '';
  ambienteTermFuera = '';

  constructor(
    private bienService: BienService,
    private categoriaService: CategoriaService,
    private listado: BienesListadoService
  ) {}

  ngOnInit(): void {
    this.categoriaService.getCategorias().subscribe(
      (data: Categoria[]) => {
        this.categorias = data;
      },
      (error) => {
        console.error('Error al obtener las categorias:', error);
        this.errorBienes = 'No se pudieron cargar las categorias.';
      }
    );

    this.cargandoBienes = true;
    this.errorBienes = '';
    this.bienService.getBienes().subscribe(
      (data: any[]) => {
        this.bienes = data.map((b) => this.listado.mapBien(b));
        this.bienesFiltrados = this.bienes.filter((bien) => this.listado.estaEnCecomp(bien));
        this.ambientesInventario = this.obtenerAmbientesInventario();
        this.bienesFueraInventario = this.bienes.filter((bien) => !this.listado.estaEnCecomp(bien));
        this.bienesFueraFiltrados = [...this.bienesFueraInventario];
        this.ajustarPaginaActual();
        this.ajustarPaginaActualFuera();
        this.cargandoBienes = false;
      },
      (error) => {
        console.error('Error al obtener los bienes:', error);
        this.errorBienes = 'No se pudieron cargar los bienes. Intenta actualizar la pagina.';
        this.cargandoBienes = false;
      }
    );
  }

  onIdTermChange(): void {
    this.buscarBienes();
  }

  onNombreTermChange(): void {
    this.buscarBienes();
  }

  buscarBienes(): void {
    this.paginaActual = 1;
    this.bienesFiltrados = this.listado.filtrarBienesEnCecomp(this.bienes, this.obtenerFiltrosInventario());
    this.ajustarPaginaActual();
  }

  onFechaSeleccionadaChange(): void {
    this.buscarBienes();
  }

  onAmbienteChange(): void {
    this.buscarBienes();
  }

  onCategoriaChange(event: any): void {
    const selectedId = Number(event.target.value);
    this.selectedCategoria = this.categorias.find((categoria) => categoria.id === selectedId) || null;
    this.buscarBienes();
  }

  onCategoriaManualChange(): void {
    this.buscarBienes();
  }

  toggleManualCategoria(): void {
    this.manualCategoria = !this.manualCategoria;
    this.categoriaManual = '';
    this.buscarBienes();
  }

  onTabChange(index: number): void {
    if (index === 0) {
      this.fechaSeleccionada = '';
      this.idTerm = '';
      this.nombreTerm = '';
      this.manualCategoria = false;
      this.categoriaManual = '';
      this.ambienteTerm = '';
      this.selectedCategoria = null;
      this.buscarBienes();
      return;
    }

    this.fechaSalidaInicio = '';
    this.fechaSalidaFin = '';
    this.searchTermFuera = '';
    this.ubicacionTermFuera = '';
    this.ambienteTermFuera = '';
    this.bienesFueraFiltrados = [...this.bienesFueraInventario];
    this.paginaActualFuera = 1;
  }

  onFechaSalidaInicioChange(): void {
    this.buscarBienesFuera();
  }

  onFechaSalidaFinChange(): void {
    this.buscarBienesFuera();
  }

  onSearchTermChangeFuera(): void {
    this.buscarBienesFuera();
  }

  onUbicacionChangeFuera(): void {
    this.buscarBienesFuera();
  }

  onAmbienteChangeFuera(): void {
    this.buscarBienesFuera();
  }

  buscarBienesFuera(): void {
    this.paginaActualFuera = 1;
    this.bienesFueraFiltrados = this.listado.filtrarBienesFuera(this.bienesFueraInventario, this.obtenerFiltrosFuera());
    this.ajustarPaginaActualFuera();
  }

  getUltimaFechaSalida(bien: Bien): string {
    return this.listado.getUltimaFechaSalida(bien);
  }

  getEstadoEnFecha(bien: Bien): string {
    return this.listado.getEstadoEnFecha(bien, this.fechaSeleccionada);
  }

  getUbicacionEnFecha(bien: Bien): string {
    return this.listado.getUbicacionEnFecha(bien, this.fechaSeleccionada);
  }

  getUsuarioEnFecha(bien: Bien): string {
    return this.listado.getUsuarioEnFecha(bien, this.fechaSeleccionada);
  }

  get bienesPaginados(): Bien[] {
    const inicio = (this.paginaActual - 1) * this.tamanioPagina;
    return this.bienesFiltrados.slice(inicio, inicio + this.tamanioPagina);
  }

  get bienesFueraPaginados(): Bien[] {
    const inicio = (this.paginaActualFuera - 1) * this.tamanioPaginaFuera;
    return this.bienesFueraFiltrados.slice(inicio, inicio + this.tamanioPaginaFuera);
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.bienesFiltrados.length / this.tamanioPagina));
  }

  get totalPaginasFuera(): number {
    return Math.max(1, Math.ceil(this.bienesFueraFiltrados.length / this.tamanioPaginaFuera));
  }

  get indiceInicio(): number {
    return this.bienesFiltrados.length === 0 ? 0 : (this.paginaActual - 1) * this.tamanioPagina + 1;
  }

  get indiceFin(): number {
    return Math.min(this.paginaActual * this.tamanioPagina, this.bienesFiltrados.length);
  }

  get indiceInicioFuera(): number {
    return this.bienesFueraFiltrados.length === 0 ? 0 : (this.paginaActualFuera - 1) * this.tamanioPaginaFuera + 1;
  }

  get indiceFinFuera(): number {
    return Math.min(this.paginaActualFuera * this.tamanioPaginaFuera, this.bienesFueraFiltrados.length);
  }

  irPaginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
    }
  }

  irPaginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
    }
  }

  irPaginaAnteriorFuera(): void {
    if (this.paginaActualFuera > 1) {
      this.paginaActualFuera--;
    }
  }

  irPaginaSiguienteFuera(): void {
    if (this.paginaActualFuera < this.totalPaginasFuera) {
      this.paginaActualFuera++;
    }
  }

  private obtenerFiltrosInventario() {
    return {
      manualCategoria: this.manualCategoria,
      categoriaManual: this.categoriaManual,
      selectedCategoria: this.selectedCategoria,
      idTerm: this.idTerm,
      nombreTerm: this.nombreTerm,
      ubicacionTerm: '',
      ambienteTerm: this.ambienteTerm,
      fechaSeleccionada: this.fechaSeleccionada
    };
  }

  private obtenerFiltrosFuera() {
    return {
      searchTerm: this.searchTermFuera,
      ubicacionTerm: this.ubicacionTermFuera,
      ambienteTerm: this.ambienteTermFuera,
      fechaSalidaInicio: this.fechaSalidaInicio,
      fechaSalidaFin: this.fechaSalidaFin
    };
  }

  private mapBien(b: any): Bien {
    const bien = new Bien(
      b.id,
      b.codigo,
      b.ID_CATEGORIA,
      b.ID_USUARIO,
      b.DESCRIPCION,
      b.FECHA_INGRESO,
      b.DIMENSION,
      b.MODELO,
      b.NUMERO_SERIE,
      b.TIPO,
      b.COLOR,
      new Categoria(b.categoria.id, b.categoria.NOMBRE_CATEGORIA),
      b.movimientos
        ? b.movimientos.map(
            (mov: any) =>
              new Detalle(
                mov.id,
                mov.ID_BIEN,
                mov.ID_AMBIENTE,
                mov.ESTADO,
                mov.FECHA_MODIFICACION,
                mov.created_at,
                mov.updated_at,
                mov.ambiente
              )
          )
        : [],
      b.usuario ? b.usuario.NOMBRES : ''
    );

    bien.historial = b.historial
      ? b.historial.map(
          (hist: any) =>
            new Historial(hist.id, hist.id_usuario, hist.id_bien, hist.fecha_inicio, hist.fecha_fin, hist.usuario)
        )
      : [];

    return bien;
  }

  private getMovimientoEnFecha(bien: Bien): Detalle | undefined {
    if (!this.fechaSeleccionada) {
      return bien.movimientos[0];
    }

    const fechaSeleccionadaDate = this.parseLocalDateEnd(this.fechaSeleccionada);
    return [...bien.movimientos]
      .filter((mov) => new Date(mov.FECHA_MODIFICACION) <= fechaSeleccionadaDate)
      .sort((a, b) => new Date(b.FECHA_MODIFICACION).getTime() - new Date(a.FECHA_MODIFICACION).getTime())[0];
  }

  private estaEnCecomp(bien: Bien): boolean {
    const ubicacion = this.getMovimientoEnFecha(bien)?.ambiente?.ubicacion?.NOMBRE || '';
    return ubicacion.toLowerCase().includes('cecomp');
  }

  private getUltimoHistorial(bien: Bien): Historial | undefined {
    return [...(bien.historial || [])].sort(
      (a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime()
    )[0];
  }

  private getFechaSalidaPorEstado(bien: Bien): string | null {
    const movimientoSalida = [...(bien.movimientos || [])]
      .filter((mov) => this.esEstadoFueraInventario(mov.ESTADO))
      .sort((a, b) => new Date(b.FECHA_MODIFICACION).getTime() - new Date(a.FECHA_MODIFICACION).getTime())[0];

    return movimientoSalida?.FECHA_MODIFICACION || this.getUltimoHistorial(bien)?.fecha_inicio || null;
  }

  private esEstadoFueraInventario(estado: string | undefined | null): boolean {
    const estadoNormalizado = (estado || '').toLowerCase();
    return estadoNormalizado.includes('raee') || estadoNormalizado.includes('chatarra');
  }

  private ajustarPaginaActual(): void {
    this.paginaActual = Math.min(Math.max(this.paginaActual, 1), this.totalPaginas);
  }

  private ajustarPaginaActualFuera(): void {
    this.paginaActualFuera = Math.min(Math.max(this.paginaActualFuera, 1), this.totalPaginasFuera);
  }

  private obtenerAmbientesInventario(): string[] {
    const ambientes = this.bienes
      .filter((bien) => this.listado.estaEnCecomp(bien))
      .map((bien) => bien.movimientos[0]?.ambiente?.NOMBRE_AMBIENTE || '')
      .filter((ambiente) => !!ambiente);

    return [...new Set(ambientes)].sort((a, b) => a.localeCompare(b));
  }

  private parseLocalDateStart(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  private parseLocalDateEnd(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day, 23, 59, 59, 999);
  }
}
