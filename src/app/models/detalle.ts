import { Ambiente } from './ambiente';
import { Ubicacion } from './ubicacion';

export class Detalle {
  id: number;
  ID_BIEN: number;
  ID_AMBIENTE: number;
  ESTADO: string;
  FECHA_MODIFICACION: string;
  created_at: string;
  updated_at: string;
  ambiente?: Ambiente;  // Incluir el ambiente relacionado, que contiene la ubicación

  constructor(
    id: number,
    ID_BIEN: number,
    ID_AMBIENTE: number,
    ESTADO: string,
    FECHA_MODIFICACION: string,
    created_at: string,
    updated_at: string,
    ambiente?: Ambiente
  ) {
    this.id = id;
    this.ID_BIEN = ID_BIEN;
    this.ID_AMBIENTE = ID_AMBIENTE;
    this.ESTADO = ESTADO;
    this.FECHA_MODIFICACION = FECHA_MODIFICACION;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.ambiente = ambiente;
  }
}
