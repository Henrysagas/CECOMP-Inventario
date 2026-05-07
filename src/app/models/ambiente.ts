import { Ubicacion } from "./ubicacion";

export class Ambiente {
    ID_AMBIENTE: number;
    ID_UBICACION: number;
    NOMBRE_AMBIENTE: string;
    ubicacion?: Ubicacion; // Relación con la ubicación
  
    constructor(ID_AMBIENTE: number, ID_UBICACION: number, NOMBRE_AMBIENTE: string, ubicacion?: Ubicacion) {
      this.ID_AMBIENTE = ID_AMBIENTE;
      this.ID_UBICACION = ID_UBICACION;
      this.NOMBRE_AMBIENTE = NOMBRE_AMBIENTE;
      this.ubicacion = ubicacion;
    }
  }
  