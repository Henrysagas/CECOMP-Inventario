export class Usuario {
  constructor(
    public id: number,
    public ID_ROL: number,
    public NOMBRES: string,
    public APELLIDOS: string,
    public USU: string,
    public PASS: string,
    public dni: string, // Campo existente
    public estado: string, // Campo existente
    public cargo?: string // Campo nuevo (opcional)
  ) {}
}