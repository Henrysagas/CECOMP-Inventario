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
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { LogVisitaService } from '../services/log-visita.service';
import { BienesListadoService } from '../services/bienes-listado.service';

@Component({
  selector: 'app-bienes',
  templateUrl: './bienes.component.html',
  styleUrls: ['./bienes.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NzTabsModule, NzMessageModule, NzModalModule]
})
export class BienesComponent implements OnInit {
  categorias: Categoria[] = [];
  selectedCategoria: any = null;
  bienes: Bien[] = [];
  bienesFiltrados: Bien[] = [];
  cargandoBienes = false;
  errorBienes = '';
  paginaActual = 1;
  tamanioPagina = 5;
  searchTerm = '';
  manualCategoria = false;
  categoriaManual = '';
  ubicacionTerm = '';
  ambienteTerm = '';
  fechaSeleccionada = '';

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
    private logVisitaService: LogVisitaService,
    private message: NzMessageService,
    private modal: NzModalService,
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

  eliminarBien(id: number): void {
    this.modal.confirm({
      nzTitle: 'Eliminar bien',
      nzContent: 'Esta accion eliminara el bien del inventario. Deseas continuar?',
      nzOkText: 'Eliminar',
      nzOkDanger: true,
      nzCancelText: 'Cancelar',
      nzOnOk: () => this.confirmarEliminarBien(id)
    });
  }

  private confirmarEliminarBien(id: number): void {
    this.bienService.eliminarBien(id).subscribe(
      () => {
        this.logVisitaService.registrarAccion('eliminar bien', '/bienes', { bien_id: id }).subscribe();
        this.bienes = this.bienes.filter((bien) => bien.id !== id);
        this.bienesFiltrados = this.bienesFiltrados.filter((bien) => bien.id !== id);
        this.bienesFueraInventario = this.bienesFueraInventario.filter((bien) => bien.id !== id);
        this.bienesFueraFiltrados = this.bienesFueraFiltrados.filter((bien) => bien.id !== id);
        this.ajustarPaginaActual();
        this.ajustarPaginaActualFuera();
        this.message.success('Bien eliminado correctamente.');
      },
      (error) => {
        console.error('Error al eliminar el bien:', error);
        this.message.error('Hubo un problema al eliminar el bien.');
      }
    );
  }

  toggleManualCategoria(): void {
    this.manualCategoria = !this.manualCategoria;
    this.categoriaManual = '';
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

  onFechaSeleccionadaChange(): void {
    this.buscarBienes();
  }

  onSearchTermChange(): void {
    this.buscarBienes();
  }

  buscarBienes(): void {
    this.paginaActual = 1;
    this.bienesFiltrados = this.listado.filtrarBienesEnCecomp(this.bienes, this.obtenerFiltrosInventario());
    this.ajustarPaginaActual();
  }

  onTabChange(index: number): void {
    if (index === 0) {
      this.fechaSeleccionada = '';
      this.searchTerm = '';
      this.manualCategoria = false;
      this.categoriaManual = '';
      this.ubicacionTerm = '';
      this.ambienteTerm = '';
      this.selectedCategoria = null;
    } else if (index === 1) {
      this.fechaSalidaInicio = '';
      this.fechaSalidaFin = '';
      this.searchTermFuera = '';
      this.ubicacionTermFuera = '';
      this.ambienteTermFuera = '';
      this.bienesFueraFiltrados = [...this.bienesFueraInventario];
      this.paginaActualFuera = 1;
    }

    this.buscarBienes();
  }

  onUbicacionChange(): void {
    this.buscarBienes();
  }

  onAmbienteChange(): void {
    this.buscarBienes();
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

  getUltimaFechaSalida(bien: Bien): string {
    return this.listado.getUltimaFechaSalida(bien);
  }

  private obtenerFiltrosInventario() {
    return {
      manualCategoria: this.manualCategoria,
      categoriaManual: this.categoriaManual,
      selectedCategoria: this.selectedCategoria,
      searchTerm: this.searchTerm,
      ubicacionTerm: this.ubicacionTerm,
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

  private estaEnCecomp(bien: Bien): boolean {
    const ubicacion = this.getMovimientoEnFecha(bien)?.ambiente?.ubicacion?.NOMBRE || '';
    return ubicacion.toLowerCase().includes('cecomp');
  }

  private getUltimoHistorial(bien: Bien): Historial | undefined {
    return [...(bien.historial || [])].sort(
      (a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime()
    )[0];
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

  private parseLocalDateStart(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  private parseLocalDateEnd(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day, 23, 59, 59, 999);
  }
}
