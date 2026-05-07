import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BienService } from '../services/bien.service';
import { Bien } from '../models/bien';
import { Categoria } from '../models/categoria';
import { Detalle } from '../models/detalle';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTableModule } from 'ng-zorro-antd/table'; // Asegúrate de importar esto
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzTableComponent } from 'ng-zorro-antd/table';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { Historial } from '../models/historial';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzCardComponent } from "ng-zorro-antd/card";

@Component({
  selector: 'app-ver-bien',
  standalone: true,
  templateUrl: './verbien.component.html',
  styleUrls: ['./verbien.component.css'],
  // Asegúrate de importar todos los módulos que uses en el HTML
  imports: [FormsModule,
    CommonModule,
    NzGridModule,
    NzTableModule,
    NzSelectModule,
    NzDescriptionsModule,
    NzTabsModule,
    NzTableComponent,
    NzTimelineModule,
    NzCardComponent,
    RouterModule],
  template: `
  <div nz-row>
  <div nz-col nzSpan="12">col-12</div>
  <div nz-col nzSpan="12">col-12</div>
  </div>  `,
})
export class VerBienComponent implements OnInit {
  bien!: Bien;
  movimientos: Detalle[] = [];
  historial: Historial[] = [];

  constructor(
    private bienService: BienService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const bienId = +this.route.snapshot.paramMap.get('id')!;

    // Obtener el bien específico
    this.bienService.getBien(bienId).subscribe((data: any) => {
      this.bien = new Bien(
        data.id,
        data.codigo,
        data.ID_CATEGORIA,
        data.ID_USUARIO,
        data.DESCRIPCION,
        data.FECHA_INGRESO,
        data.DIMENSION,
        data.MODELO,
        data.NUMERO_SERIE,
        data.TIPO,
        data.COLOR,
        new Categoria(data.categoria.id, data.categoria.NOMBRE_CATEGORIA),
        data.movimientos ? data.movimientos.map((mov: any) => new Detalle(
          mov.id,
          mov.ID_BIEN,
          mov.ID_AMBIENTE,
          mov.ESTADO,
          mov.FECHA_MODIFICACION,
          mov.created_at,
          mov.updated_at
        )) : [],
        data.usuario ? data.usuario.NOMBRES : ''
      );

      // Cargar movimientos del bien
      this.cargarMovimientos(bienId);
      this.cargarHistorial(bienId);

    });
  }

  cargarMovimientos(bienId: number): void {
    this.bienService.getMovimientosByBienId(bienId).subscribe(
      (movimientos: Detalle[]) => {
        this.movimientos = movimientos.sort((a, b) => new Date(b.FECHA_MODIFICACION).getTime() - new Date(a.FECHA_MODIFICACION).getTime());
      },
      error => {
        console.error('Error al cargar movimientos:', error);
      }
    );
  }
  cargarHistorial(bienId: number): void {
    this.bienService.getHistorialByBienId(bienId).subscribe(
      (historial: Historial[]) => {
        this.historial = historial.sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime());
      },
      error => {
        console.error('Error al cargar el historial:', error);
      }
    );
  }
}
