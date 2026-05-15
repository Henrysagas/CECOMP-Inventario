import { Bien } from './bien';
import { Usuario } from './usuario';

export interface ObservacionBien {
  id: number;
  ID_BIEN: number;
  tipo_evento: string;
  observacion?: string | null;
  fecha_evento?: string | null;
  id_usuario?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  bien?: Bien | null;
  usuario?: Usuario | null;
}

export type ObservacionBienPayload = Pick<ObservacionBien, 'ID_BIEN' | 'tipo_evento'> &
  Partial<Pick<ObservacionBien, 'observacion' | 'fecha_evento' | 'id_usuario'>>;

export interface ObservacionBienFilters {
  ID_BIEN?: number | string | null;
  id_usuario?: number | string | null;
  tipo_evento?: string | null;
}
