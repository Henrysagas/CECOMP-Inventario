import { Injectable } from '@angular/core';
import { Bien } from '../models/bien';
import { Categoria } from '../models/categoria';
import { Detalle } from '../models/detalle';
import { Historial } from '../models/historial';

export interface BienesInventarioFilters {
  manualCategoria: boolean;
  categoriaManual: string;
  selectedCategoria: Categoria | null;
  idTerm: string;
  nombreTerm: string;
  ubicacionTerm: string;
  ambienteTerm: string;
  fechaSeleccionada: string;
}

export interface BienesFueraFilters {
  searchTerm: string;
  ubicacionTerm: string;
  ambienteTerm: string;
  fechaSalidaInicio: string;
  fechaSalidaFin: string;
}

@Injectable({ providedIn: 'root' })
export class BienesListadoService {
  mapBien(b: any): Bien {
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

  filtrarBienesEnCecomp(bienes: Bien[], filters: BienesInventarioFilters): Bien[] {
    return bienes.filter((bien) => {
      if (!this.estaEnCecomp(bien, filters.fechaSeleccionada)) {
        return false;
      }

      let match = true;

      if (filters.manualCategoria && filters.categoriaManual) {
        match = bien.categoria.NOMBRE_CATEGORIA.toLowerCase().includes(filters.categoriaManual.toLowerCase());
      }

      if (!filters.manualCategoria && filters.selectedCategoria) {
        match = match && bien.ID_CATEGORIA === filters.selectedCategoria.id;
      }

      if (filters.idTerm) {
        match = match && bien.codigo.toString().includes(filters.idTerm.toLowerCase());
      }

      if (filters.nombreTerm) {
        match = match && this.coincideConDatosEscribibles(bien, filters.nombreTerm);
      }

      if (filters.ubicacionTerm) {
        const ubicacionActual =
          this.getMovimientoEnFecha(bien, filters.fechaSeleccionada)?.ambiente?.ubicacion?.NOMBRE || 'Sin Movimiento';
        match = match && ubicacionActual.toLowerCase().includes(filters.ubicacionTerm.toLowerCase());
      }

      if (filters.ambienteTerm) {
        const ambienteActual =
          this.getMovimientoEnFecha(bien, filters.fechaSeleccionada)?.ambiente?.NOMBRE_AMBIENTE || 'Sin Movimiento';
        match = match && ambienteActual.toLowerCase().includes(filters.ambienteTerm.toLowerCase());
      }

      if (filters.fechaSeleccionada) {
        const fechaSeleccionadaDate = this.parseLocalDateEnd(filters.fechaSeleccionada);
        const movimientosValidos = bien.movimientos.filter(
          (mov) => new Date(mov.FECHA_MODIFICACION) <= fechaSeleccionadaDate
        );

        if (movimientosValidos.length === 0 || !this.getUsuarioEnFecha(bien, filters.fechaSeleccionada)) {
          return false;
        }
      }

      return match;
    });
  }

  filtrarBienesFuera(bienes: Bien[], filters: BienesFueraFilters): Bien[] {
    return bienes.filter((bien) => {
      let match = true;

      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        match =
          bien.codigo.toString().includes(term) ||
          this.coincideConDatosEscribibles(bien, term);
      }

      if (filters.ubicacionTerm) {
        const ubicacionActual = bien.movimientos[0]?.ambiente?.ubicacion?.NOMBRE || 'Sin Movimiento';
        match = match && ubicacionActual.toLowerCase().includes(filters.ubicacionTerm.toLowerCase());
      }

      if (filters.ambienteTerm) {
        const ambienteActual = bien.movimientos[0]?.ambiente?.NOMBRE_AMBIENTE || 'Sin Movimiento';
        match = match && ambienteActual.toLowerCase().includes(filters.ambienteTerm.toLowerCase());
      }

      const ultimaFechaSalida = this.getFechaSalidaPorEstado(bien);
      const ultimaFechaSalidaDate = ultimaFechaSalida ? new Date(ultimaFechaSalida) : null;

      if (filters.fechaSalidaInicio && ultimaFechaSalidaDate) {
        match = match && ultimaFechaSalidaDate >= this.parseLocalDateStart(filters.fechaSalidaInicio);
      }

      if (filters.fechaSalidaFin && ultimaFechaSalidaDate) {
        match = match && ultimaFechaSalidaDate <= this.parseLocalDateEnd(filters.fechaSalidaFin);
      }

      if ((filters.fechaSalidaInicio || filters.fechaSalidaFin) && !ultimaFechaSalidaDate) {
        return false;
      }

      return match;
    });
  }

  getEstadoEnFecha(bien: Bien, fechaSeleccionada: string): string {
    const movimiento = this.getMovimientoEnFecha(bien, fechaSeleccionada);
    return movimiento?.ESTADO || 'Sin Estado';
  }

  getUbicacionEnFecha(bien: Bien, fechaSeleccionada: string): string {
    const movimiento = this.getMovimientoEnFecha(bien, fechaSeleccionada);
    const ubicacion = movimiento?.ambiente?.ubicacion?.NOMBRE;
    const ambiente = movimiento?.ambiente?.NOMBRE_AMBIENTE;

    return ubicacion && ambiente ? `${ubicacion} - ${ambiente}` : 'No Registrado';
  }

  getUsuarioEnFecha(bien: Bien, fechaSeleccionada: string): string {
    if (!fechaSeleccionada) {
      return bien.usuario || 'Sin Usuario';
    }

    const fechaSeleccionadaStart = this.parseLocalDateStart(fechaSeleccionada);
    const fechaSeleccionadaEnd = this.parseLocalDateEnd(fechaSeleccionada);
    const historialValido = [...(bien.historial || [])]
      .filter((hist) => {
        const fechaInicio = new Date(hist.fecha_inicio);
        const fechaFin = hist.fecha_fin ? new Date(hist.fecha_fin) : null;

        return fechaInicio <= fechaSeleccionadaEnd && (!fechaFin || fechaFin >= fechaSeleccionadaStart);
      })
      .sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime())[0];

    return historialValido?.usuario?.NOMBRES || 'Sin Usuario';
  }

  getUltimaFechaSalida(bien: Bien): string {
    return this.getFechaSalidaPorEstado(bien) || 'No disponible';
  }

  estaEnCecomp(bien: Bien, fechaSeleccionada = ''): boolean {
    const ubicacion = this.getMovimientoEnFecha(bien, fechaSeleccionada)?.ambiente?.ubicacion?.NOMBRE || '';
    return ubicacion.toLowerCase().includes('cecomp');
  }

  private coincideConDatosEscribibles(bien: Bien, term: string): boolean {
    const normalizedTerm = term.toLowerCase();
    const valores = [
      bien.DESCRIPCION,
      bien.MODELO,
      bien.NUMERO_SERIE,
      bien.TIPO,
      bien.COLOR,
      bien.DIMENSION,
      bien.categoria?.NOMBRE_CATEGORIA
    ];

    return valores.some((value) => (value || '').toString().toLowerCase().includes(normalizedTerm));
  }

  private getMovimientoEnFecha(bien: Bien, fechaSeleccionada: string): Detalle | undefined {
    if (!fechaSeleccionada) {
      return bien.movimientos[0];
    }

    const fechaSeleccionadaDate = this.parseLocalDateEnd(fechaSeleccionada);
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

  private getUltimoHistorial(bien: Bien): Historial | undefined {
    return [...(bien.historial || [])].sort(
      (a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime()
    )[0];
  }

  private esEstadoFueraInventario(estado: string | undefined | null): boolean {
    const estadoNormalizado = (estado || '').toLowerCase();
    return estadoNormalizado.includes('raee') || estadoNormalizado.includes('chatarra');
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
