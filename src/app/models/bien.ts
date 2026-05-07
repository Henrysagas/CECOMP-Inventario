import { Categoria } from './categoria';
import { Detalle } from './detalle';
import { Historial } from './historial';

export class Bien {
  id: number;
  codigo: number; // Añadido el campo código
  ID_CATEGORIA: number;
  ID_USUARIO: number;
  DESCRIPCION: string;
  FECHA_INGRESO: string;
  DIMENSION: string | null;
  MODELO: string;
  NUMERO_SERIE: string;
  TIPO: string;
  COLOR: string;
  categoria: Categoria;
  movimientos: Detalle[];  // Historial de movimientos (Detalle)
  usuario: string;  // Nombre del usuario
  historial?: Historial[]; // 🔹 Propiedad opcional

  constructor(
    id: number,
    codigo: number,  // Añadido en el constructor
    ID_CATEGORIA: number,
    ID_USUARIO: number,
    DESCRIPCION: string,
    FECHA_INGRESO: string,
    DIMENSION: string | null,
    MODELO: string,
    NUMERO_SERIE: string,
    TIPO: string,
    COLOR: string,
    categoria: Categoria,
    movimientos: Detalle[],
    usuario: string  // Nombre del usuario
  ) {
    this.id = id;
    this.codigo = codigo;  // Inicializa el campo código
    this.ID_CATEGORIA = ID_CATEGORIA;
    this.ID_USUARIO = ID_USUARIO;
    this.DESCRIPCION = DESCRIPCION;
    this.FECHA_INGRESO = FECHA_INGRESO;
    this.DIMENSION = DIMENSION;
    this.MODELO = MODELO;
    this.NUMERO_SERIE = NUMERO_SERIE;
    this.TIPO = TIPO;
    this.COLOR = COLOR;
    this.categoria = categoria;
    this.movimientos = movimientos;
    this.usuario = usuario;
  }
}
