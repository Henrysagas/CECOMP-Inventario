export class Historial {
  constructor(
    public id: number,
    public id_usuario: number,
    public id_bien: number,
    public fecha_inicio: string,
    public fecha_fin?: string | null,
    public usuario?: { NOMBRES: string }
  ) {}

    get vigente(): boolean {
    return !this.fecha_fin;
  }

  
}