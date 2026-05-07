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

@Component({
  selector: 'app-bienes',
  templateUrl: './bienes.component.html',
  styleUrls: ['./bienes.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NzTabsModule]
})
export class BienesComponent implements OnInit {
  categorias: Categoria[] = [];
  selectedCategoria: any = null;
  bienes: Bien[] = [];
  bienesFiltrados: Bien[] = [];
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

  constructor(private bienService: BienService, private categoriaService: CategoriaService) {}

  ngOnInit(): void {
    this.categoriaService.getCategorias().subscribe(
      (data: Categoria[]) => {
        this.categorias = data;
      },
      (error) => {
        console.error('Error al obtener las categorias:', error);
      }
    );

    this.bienService.getBienes().subscribe(
      (data: any[]) => {
        this.bienes = data.map((b) => this.mapBien(b));
        this.bienesFiltrados = this.bienes.filter((bien) => !this.estaFueraInventario(bien));
        this.bienesFueraInventario = this.bienes.filter((bien) => this.estaFueraInventario(bien));
        this.bienesFueraFiltrados = [...this.bienesFueraInventario];
        this.ajustarPaginaActual();
        this.ajustarPaginaActualFuera();
      },
      (error) => {
        console.error('Error al obtener los bienes:', error);
      }
    );
  }

  eliminarBien(id: number): void {
    if (confirm('Estas seguro de que deseas eliminar este bien?')) {
      this.bienService.eliminarBien(id).subscribe(
        () => {
          this.bienes = this.bienes.filter((bien) => bien.id !== id);
          this.bienesFiltrados = this.bienesFiltrados.filter((bien) => bien.id !== id);
          this.bienesFueraInventario = this.bienesFueraInventario.filter((bien) => bien.id !== id);
          this.bienesFueraFiltrados = this.bienesFueraFiltrados.filter((bien) => bien.id !== id);
          this.ajustarPaginaActual();
          this.ajustarPaginaActualFuera();
          alert('Bien eliminado exitosamente');
        },
        (error) => {
          console.error('Error al eliminar el bien:', error);
          alert('Hubo un problema al eliminar el bien');
        }
      );
    }
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
    this.bienesFiltrados = this.bienes.filter((bien) => {
      if (this.estaFueraInventario(bien)) {
        return false;
      }

      let match = true;

      if (this.manualCategoria && this.categoriaManual) {
        match = bien.categoria.NOMBRE_CATEGORIA.toLowerCase().includes(this.categoriaManual.toLowerCase());
      }

      if (!this.manualCategoria && this.selectedCategoria) {
        match = match && bien.ID_CATEGORIA === this.selectedCategoria.id;
      }

      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        match =
          match &&
          (bien.codigo.toString().includes(term) ||
            bien.DESCRIPCION?.toLowerCase().includes(term) ||
            bien.MODELO?.toLowerCase().includes(term) ||
            bien.NUMERO_SERIE?.toLowerCase().includes(term));
      }

      if (this.ubicacionTerm) {
        const ubicacionActual = bien.movimientos[0]?.ambiente?.ubicacion?.NOMBRE || 'Sin Movimiento';
        match = match && ubicacionActual.toLowerCase().includes(this.ubicacionTerm.toLowerCase());
      }

      if (this.ambienteTerm) {
        const ambienteActual = bien.movimientos[0]?.ambiente?.NOMBRE_AMBIENTE || 'Sin Movimiento';
        match = match && ambienteActual.toLowerCase().includes(this.ambienteTerm.toLowerCase());
      }

      if (this.fechaSeleccionada) {
        const fechaSeleccionadaDate = this.parseLocalDateEnd(this.fechaSeleccionada);
        const movimientosValidos = bien.movimientos.filter(
          (mov) => new Date(mov.FECHA_MODIFICACION) <= fechaSeleccionadaDate
        );

        if (movimientosValidos.length === 0 || !this.getUsuarioEnFecha(bien)) {
          return false;
        }
      }

      return match;
    });
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
    const movimiento = this.getMovimientoEnFecha(bien);
    return movimiento?.ESTADO || 'Sin Estado';
  }

  getUbicacionEnFecha(bien: Bien): string {
    const movimiento = this.getMovimientoEnFecha(bien);
    const ubicacion = movimiento?.ambiente?.ubicacion?.NOMBRE;
    const ambiente = movimiento?.ambiente?.NOMBRE_AMBIENTE;

    return ubicacion && ambiente ? `${ubicacion} - ${ambiente}` : 'No Registrado';
  }

  getUsuarioEnFecha(bien: Bien): string {
    if (!this.fechaSeleccionada) {
      return bien.usuario || 'Sin Usuario';
    }

    const fechaSeleccionadaStart = this.parseLocalDateStart(this.fechaSeleccionada);
    const fechaSeleccionadaEnd = this.parseLocalDateEnd(this.fechaSeleccionada);
    const historialValido = [...(bien.historial || [])]
      .filter((hist) => {
        const fechaInicio = new Date(hist.fecha_inicio);
        const fechaFin = hist.fecha_fin ? new Date(hist.fecha_fin) : null;

        return fechaInicio <= fechaSeleccionadaEnd && (!fechaFin || fechaFin >= fechaSeleccionadaStart);
      })
      .sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime())[0];

    return historialValido?.usuario?.NOMBRES || 'Sin Usuario';
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

  buscarBienesFuera(): void {
    this.paginaActualFuera = 1;
    this.bienesFueraFiltrados = this.bienesFueraInventario.filter((bien) => {
      let match = true;

      if (this.searchTermFuera) {
        const term = this.searchTermFuera.toLowerCase();
        match =
          bien.DESCRIPCION?.toLowerCase().includes(term) ||
          bien.codigo.toString().includes(term) ||
          bien.MODELO?.toLowerCase().includes(term) ||
          bien.NUMERO_SERIE?.toLowerCase().includes(term);
      }

      const ultimaFechaSalida = this.getFechaSalidaPorEstado(bien);
      const ultimaFechaSalidaDate = ultimaFechaSalida ? new Date(ultimaFechaSalida) : null;

      if (this.fechaSalidaInicio && ultimaFechaSalidaDate) {
        match = match && ultimaFechaSalidaDate >= this.parseLocalDateStart(this.fechaSalidaInicio);
      }

      if (this.fechaSalidaFin && ultimaFechaSalidaDate) {
        match = match && ultimaFechaSalidaDate <= this.parseLocalDateEnd(this.fechaSalidaFin);
      }

      if ((this.fechaSalidaInicio || this.fechaSalidaFin) && !ultimaFechaSalidaDate) {
        return false;
      }

      return match;
    });
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
    return this.getFechaSalidaPorEstado(bien) || 'No disponible';
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

  private estaFueraInventario(bien: Bien): boolean {
    const ultimoHistorial = this.getUltimoHistorial(bien);
    return !!ultimoHistorial && (ultimoHistorial.id_usuario === 7 || ultimoHistorial.id_usuario === 8);
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
