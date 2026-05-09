import { Injectable } from '@angular/core';

export interface DocumentoConfig {
  institucion: string;
  dependencia: string;
  oficina: string;
  ubicacionCecomp: string;
  nombreInterno: string;
  motivoInterno: string;
  documentoInterno: string;
  tituloMovimientoInterno: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentoConfigService {
  private readonly storageKey = 'documentoConfig';

  private readonly defaults: DocumentoConfig = {
    institucion: 'Universidad Nacional del Santa',
    dependencia: 'Direccion General de Administracion',
    oficina: 'Oficina de Control Patrimonial',
    ubicacionCecomp: 'CECOMP',
    nombreInterno: 'CECOMP',
    motivoInterno: 'Movimiento interno entre ambientes de CECOMP',
    documentoInterno: 'Registro interno CECOMP',
    tituloMovimientoInterno: 'REPORTE DE MOVIMIENTO INTERNO DE BIENES CECOMP'
  };

  getConfig(): DocumentoConfig {
    const stored = localStorage.getItem(this.storageKey);

    if (!stored) {
      return { ...this.defaults };
    }

    try {
      return { ...this.defaults, ...JSON.parse(stored) };
    } catch {
      return { ...this.defaults };
    }
  }

  saveConfig(config: DocumentoConfig): void {
    localStorage.setItem(this.storageKey, JSON.stringify({
      ...this.defaults,
      ...config
    }));
  }

  resetConfig(): DocumentoConfig {
    localStorage.removeItem(this.storageKey);
    return this.getConfig();
  }
}
