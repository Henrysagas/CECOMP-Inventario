import { Injectable } from '@angular/core';
import { Bien } from '../models/bien';
import { Detalle } from '../models/detalle';
import { Modalidad } from '../models/modalidad';
import { Usuario } from '../models/usuario';

export interface TransferenciaFilters {
  searchTerm: string;
  selectedCategoria: number | null;
  ubicacionTerm: string;
  ambienteTerm: string;
}

export interface PersonasTransferencia {
  personaRecibe: string;
  cargoRecibe: string;
  personaEntrega: string;
  cargoEntrega: string;
  personaControl: string;
  cargoControl: string;
}

@Injectable({
  providedIn: 'root'
})
export class TransferenciaPresenterService {
  filtrarBienes(bienes: Bien[], filters: TransferenciaFilters): Bien[] {
    const searchTerm = filters.searchTerm.toLowerCase();
    const ubicacionTerm = filters.ubicacionTerm.toLowerCase();
    const ambienteTerm = filters.ambienteTerm.toLowerCase();

    return bienes.filter(bien => {
      const coincideBusqueda =
        !searchTerm ||
        bien.DESCRIPCION.toLowerCase().includes(searchTerm) ||
        bien.codigo.toString().includes(searchTerm);
      const coincideCategoria = !filters.selectedCategoria || bien.categoria.id === filters.selectedCategoria;
      const ubicacionActual = bien.movimientos[0]?.ambiente?.ubicacion?.NOMBRE || 'Sin Movimiento';
      const ambienteActual = bien.movimientos[0]?.ambiente?.NOMBRE_AMBIENTE || 'Sin Movimiento';
      const coincideUbicacion = !ubicacionTerm || ubicacionActual.toLowerCase().includes(ubicacionTerm);
      const coincideAmbiente = !ambienteTerm || ambienteActual.toLowerCase().includes(ambienteTerm);

      return coincideBusqueda && coincideCategoria && coincideUbicacion && coincideAmbiente;
    });
  }

  filtrarSeleccionados(bienes: Bien[], searchTerm: string): Bien[] {
    const term = searchTerm.toLowerCase();
    return bienes.filter(
      bien => bien.DESCRIPCION.toLowerCase().includes(term) || bien.id.toString().includes(term)
    );
  }

  seleccionarTodos(bienes: Bien[], checked: boolean, selectedIds: Record<number, boolean>): Record<number, boolean> {
    const next = { ...selectedIds };
    bienes.forEach(bien => {
      next[bien.id] = checked;
    });

    return next;
  }

  obtenerSeleccionados(bienes: Bien[], selectedIds: Record<number, boolean>): Bien[] {
    return bienes.filter(bien => selectedIds[bien.id]);
  }

  obtenerDisponibles(bienes: Bien[], seleccionados: Bien[]): Bien[] {
    return bienes.filter(bien => !seleccionados.some(seleccionado => seleccionado.id === bien.id));
  }

  obtenerEstadoBien(bien: Bien, tipoModalidad: number | null): string {
    if (tipoModalidad === 4) {
      return 'RAEE/Chatarra';
    }

    return bien.movimientos[0]?.ESTADO || 'Nuevo';
  }

  obtenerDatosUsuario(usuario: Usuario | undefined): { nombreCompleto: string; cargo: string } | null {
    if (!usuario) {
      return null;
    }

    return {
      nombreCompleto: `${usuario.NOMBRES || ''} ${usuario.APELLIDOS || ''}`.trim(),
      cargo: usuario.cargo || ''
    };
  }

  tienePersonasCompletas(personas: PersonasTransferencia): boolean {
    return Boolean(
      personas.personaRecibe &&
        personas.cargoRecibe &&
        personas.personaEntrega &&
        personas.cargoEntrega &&
        personas.personaControl &&
        personas.cargoControl
    );
  }

  crearMovimientoInterno(bienId: number, ambienteDestinoId: number, estado: string, fecha: Date): Detalle {
    const fechaActual = this.formatDateTime(fecha);
    return new Detalle(0, bienId, ambienteDestinoId, estado, fechaActual, fechaActual, fechaActual);
  }

  crearModalidad(params: {
    nombre: string;
    fechaMovimiento: Date;
    motivo: string;
    documentoAutorizado: string;
    tipoModalidadId: number | null;
    ubicacionProcedenteId: number | null;
    ambienteDestinoId: number | null;
    personas: PersonasTransferencia;
  }): Modalidad {
    return new Modalidad(
      undefined,
      params.nombre,
      this.formatDate(params.fechaMovimiento),
      params.motivo,
      params.documentoAutorizado || '',
      params.tipoModalidadId || 0,
      params.ubicacionProcedenteId || null,
      params.ambienteDestinoId || null,
      undefined,
      params.personas.cargoRecibe,
      params.personas.personaRecibe,
      params.personas.cargoEntrega,
      params.personas.personaEntrega,
      params.personas.cargoControl,
      params.personas.personaControl
    );
  }

  normalizeDate(value: Date | string | null): Date | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return value;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDateTime(date: Date): string {
    return `${this.formatDate(date)} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
  }
}
