import { Usuario } from './usuario';

export interface LogVisita {
  id: number;
  id_usuario: number;
  usuario?: Usuario | null;
  ruta: string;
  accion: string;
  metodo?: string | null;
  ip?: string | null;
  user_agent?: string | null;
  detalles?: unknown;
  created_at: string;
  updated_at?: string;
}
