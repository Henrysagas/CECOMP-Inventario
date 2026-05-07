
export class Ubicacion {
    ID_UBICACION: number;
    CODIGO: string;
    NOMBRE: string;
    DIRECCION: number;  // Solo el ID de la Dirección (tipo number)

    constructor(ID_UBICACION: number, CODIGO: string, NOMBRE: string, direccion: number) {
        this.ID_UBICACION = ID_UBICACION;
        this.CODIGO = CODIGO;
        this.NOMBRE = NOMBRE;
        this.DIRECCION = direccion;  // Asigna solo el ID
    }
}