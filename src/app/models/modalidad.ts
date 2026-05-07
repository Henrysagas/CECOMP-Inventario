import { BienModalidad } from './bien-modalidad';

export class Modalidad {
  id?: number;
  nombre!: string;
  fecha!: string;
  motivo_traslado!: string;
  documento_autorizacion!: string;
  ID_TIPO_MODALIDAD!: number; 
  ID_PROCEDENCIA!: number | null;
  ID_DESTINO!: number | null;
  bienes: BienModalidad[]; // Para almacenar los bienes

  // Nuevos atributos opcionales
  cargo1?: string;
  persona1?: string;
  cargo2?: string;
  persona2?: string;
  cargo3?: string;
  persona3?: string;

  constructor(
      id?: number,
      nombre?: string,
      fecha?: string,
      motivo_traslado?: string,
      documento_autorizacion?: string,
      ID_TIPO_MODALIDAD?: number,
      ID_PROCEDENCIA?: number | null,
      ID_DESTINO?: number | null,
      bienes?: BienModalidad[], // Para almacenar los bienes
      cargo1?: string,
      persona1?: string,
      cargo2?: string,
      persona2?: string,
      cargo3?: string,
      persona3?: string
  ) {
      this.id = id || 0;
      this.nombre = nombre || '';
      this.fecha = fecha || '';
      this.motivo_traslado = motivo_traslado || '';
      this.documento_autorizacion = documento_autorizacion || '';
      this.ID_TIPO_MODALIDAD = ID_TIPO_MODALIDAD || 0;
      this.ID_PROCEDENCIA = ID_PROCEDENCIA || null;
      this.ID_DESTINO = ID_DESTINO || null;
      this.bienes = bienes || []; // Inicializar el array de bienes

      // Inicializar los nuevos atributos opcionales
      this.cargo1 = cargo1 || '';
      this.persona1 = persona1 || '';
      this.cargo2 = cargo2 || '';
      this.persona2 = persona2 || '';
      this.cargo3 = cargo3 || '';
      this.persona3 = persona3 || '';
  }
}
