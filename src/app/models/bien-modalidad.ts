import { Bien } from './bien';
import { Categoria } from './categoria';

export class BienModalidad {
  ID_BIEN_MODALIDAD!: number;
  ID_BIEN!: number; // ID del bien relacionado
  ID_MODALIDAD!: number; // ID de la modalidad/documento
  estado!: string; // Estado del bien (Nuevo, Bueno, Regular, Malo, RAEE/Chatarra)
  created_at!: string; // Fecha de creación de la relación bien-modalidad
  updated_at!: string; // Fecha de última actualización
  bien!: Bien; // Objeto Bien relacionado

  constructor(
    ID_BIEN_MODALIDAD?: number,
    ID_BIEN?: number,
    ID_MODALIDAD?: number,
    estado?: string,
    created_at?: string,
    updated_at?: string,
    bien?: Bien // Parámetro para el bien relacionado
  ) {
    this.ID_BIEN_MODALIDAD = ID_BIEN_MODALIDAD || 0;
    this.ID_BIEN = ID_BIEN || 0;
    this.ID_MODALIDAD = ID_MODALIDAD || 0;
    this.estado = estado || '';
    this.created_at = created_at || '';
    this.updated_at = updated_at || '';
    this.bien = bien || new Bien(0, 0, 0, 0, '', '', null, '', '', '', '', new Categoria(1,"error"), [], ''); // Inicialización del bien
  }
}
