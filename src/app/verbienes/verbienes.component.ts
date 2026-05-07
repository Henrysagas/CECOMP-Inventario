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

@Component({
  selector: 'app-verbienes',
  templateUrl: './verbienes.component.html',
  styleUrls: ['./verbienes.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class VerbienesComponent implements OnInit {
  categorias: Categoria[] = [];
  bienes: Bien[] = [];
  bienesFiltrados: Bien[] = [];
  searchTerm = '';
  categoriaManual = '';
  ubicacionTerm = '';
  ambienteTerm = '';
  manualCategoria = false;
  selectedCategoria: any = null;
  fechaSeleccionada = '';

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
        this.bienesFiltrados = [...this.bienes];
      },
      (error) => {
        console.error('Error al obtener los bienes:', error);
      }
    );
  }

  onSearchTermChange(): void {
    this.buscarBienes();
  }

  buscarBienes(): void {
    this.bienesFiltrados = this.bienes.filter((bien) => {
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
  }

  onFechaSeleccionadaChange(): void {
    this.buscarBienes();
  }

  onUbicacionChange(): void {
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

  getUltimaFechaSalida(bien: Bien): string {
    const ultimoHistorial = [...(bien.historial || [])].sort(
      (a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime()
    )[0];

    return ultimoHistorial?.fecha_inicio || 'No disponible';
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

  private parseLocalDateStart(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  private parseLocalDateEnd(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day, 23, 59, 59, 999);
  }
}
