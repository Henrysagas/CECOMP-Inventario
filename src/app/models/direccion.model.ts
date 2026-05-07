
export class DireccionModel {
  id: number;  // Cambia ID a id para que coincida con la respuesta del backend
    nombre: string;

    constructor(id:number ,NOMBRE: string) {
      this.id = id;
      this.nombre = NOMBRE;
    }

}
