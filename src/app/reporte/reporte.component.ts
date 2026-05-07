import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ModalidadService } from '../services/modalidad.service';
import { Modalidad } from '../models/modalidad';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { CategoriaService } from '../services/categoria.service';
import { Categoria } from '../models/categoria';
import { Ubicacion } from '../models/ubicacion';
import { Ambiente } from '../models/ambiente';
import { DireccionModel } from '../models/direccion.model';
import { DireccionesService } from '../services/direcciones.service';
import { UbicacionService } from '../services/ubicacion.service';
import { AmbienteService } from '../services/ambiente.service';
import { Bien } from '../models/bien';
import { BienService } from '../services/bien.service';
import { Detalle } from '../models/detalle';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';

interface ConsultaGenerada {
  id: number;
  fechaGeneracion: Date;
  direccion: string;
  ubicacion: string;
  ambiente: string;
  categoria: string;
  fechaConsulta: string;
  bienes: Bien[];
}

@Component({
  selector: 'app-reporte',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    NzTableModule, 
    NzButtonModule, 
    NzDatePickerModule, 
    NzTabsModule,
    NzSelectModule,
    NzPaginationModule
  ],
  templateUrl: './reporte.component.html',
  styleUrls: ['./reporte.component.css']
})
export class ReporteComponent implements OnInit {

  
  transferReportData: Modalidad[] = [];
  filteredTransferReportData: Modalidad[] = [];
  dateRangeTransferencia: Date[] | null = null;

  categorias: Categoria[] = [];
  selectedCategoria: Categoria | null = null;
  consultaDate: Date | null = null;
  direcciones: DireccionModel[] = [];
  ubicaciones: Ubicacion[] = [];
  ambientes: Ambiente[] = [];
  selectedDireccionId: number | null = null;
  selectedUbicacionId: number | null = null;
  selectedAmbienteId: number | null = null;
  ubicacionesFiltradas: Ubicacion[] = [];
  ambientesFiltrados: Ambiente[] = [];
  bienesFiltrados: Bien[] = [];
  ubicacionSeleccionada: string = '';
  bienesFiltradosPorCategoria: Bien[] = [];
  consultasGeneradas: ConsultaGenerada[] = [];
  consultaSeleccionadaId: number | null = null;

  constructor(
    private router: Router, 
    private modalidadService: ModalidadService,
    private categoriaService: CategoriaService,
    private direccionesService: DireccionesService,
    private ubicacionService: UbicacionService,
    private bienService: BienService,
    private ambienteService: AmbienteService
  ) {}

  ngOnInit(): void {
    this.consultaDate = new Date();
    this.loadTransferReports();
    this.loadDirecciones();
    this.loadUbicaciones(); 
    this.loadAmbientes(); 
    this.loadCategorias(); 
  }
  buscarBienesPorUbicacion(registrarConsulta: boolean = false): void {
    if (!this.selectedAmbienteId) {
      this.bienesFiltrados = [];
      this.bienesFiltradosPorCategoria = [];
      return;
    }
  
    const fechaConsulta = this.normalizeDate(this.consultaDate) || new Date();
  
    this.bienService.getBienPorAmbiente(this.selectedAmbienteId!, this.formatDate(fechaConsulta)).subscribe(
      (bienes: Bien[]) => {
        const bienesNormalizados = bienes.map(bien => new Bien(
          bien.id,
          bien.codigo,
          bien.ID_CATEGORIA,
          bien.ID_USUARIO,
          bien.DESCRIPCION,
          bien.FECHA_INGRESO,
          bien.DIMENSION,
          bien.MODELO,
          bien.NUMERO_SERIE,
          bien.TIPO,
          bien.COLOR,
          bien.categoria,
          bien.movimientos || [],
          bien.usuario || 'Sin Usuario'
        ));

        this.bienesFiltrados = bienesNormalizados;

        this.aplicarFiltroCategoria(); // Aplica el filtro luego de cargar los bienes
        if (registrarConsulta) {
          this.registrarConsultaGenerada();
        }
      },
      error => console.error('Error al obtener bienes:', error)
    );
  }
  aplicarFiltroCategoria(): void {
    if (this.selectedCategoria) {
      this.bienesFiltradosPorCategoria = this.bienesFiltrados.filter(bien =>
        bien.ID_CATEGORIA === this.selectedCategoria?.id
      );
    } else {
      this.bienesFiltradosPorCategoria = [...this.bienesFiltrados];
    }
  }
  
  // Función para formatear la fecha en formato YYYY-MM-DD
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  

  generarReporte(tipo: string): void {
    if (tipo === 'transferencia') {
      this.router.navigate(['/transferencia']);
    } else {
      this.buscarBienesPorUbicacion(true);
    }
  }

  loadDirecciones(): void {
    this.direccionesService.getDirecciones().subscribe(
      (direcciones: DireccionModel[]) => this.direcciones = direcciones,
      error => console.error('Error al cargar direcciones:', error)
    );
  }
  

  loadUbicaciones(): void {
    this.ubicacionService.getUbicaciones().subscribe(
      (ubicaciones: Ubicacion[]) => this.ubicaciones = ubicaciones,
      error => console.error('Error al cargar ubicaciones:', error)
    );
  }

  loadAmbientes(): void {
    this.ambienteService.getAmbientes().subscribe(
      (ambientes: Ambiente[]) => this.ambientes = ambientes,
      error => console.error('Error al cargar ambientes:', error)
    );
  }
  onDireccionChange(): void {
    this.selectedUbicacionId = null;
    this.selectedAmbienteId = null;
    this.ambientesFiltrados = [];
    
    if (this.selectedDireccionId) {
      this.ubicacionService.getUbicacionesByDireccion(this.selectedDireccionId).subscribe(
        (ubicaciones: Ubicacion[]) => this.ubicacionesFiltradas = ubicaciones,
        error => console.error('Error al cargar ubicaciones:', error)
      );
    } else {
      this.ubicacionesFiltradas = [];
    }
  }


  filterReportsByDate(tipo: string): void {
    if (tipo === 'transferencia') {
      if (!this.dateRangeTransferencia || this.dateRangeTransferencia.length !== 2) {
        this.filteredTransferReportData = this.transferReportData;
        return;
      }
      const [startDate, endDate] = this.dateRangeTransferencia;
      const start = this.startOfDay(startDate);
      const end = this.endOfDay(endDate);
      this.filteredTransferReportData = this.transferReportData.filter((reporte) => {
        const reportDate = new Date(reporte.fecha);
        return reportDate >= start && reportDate <= end;
      });
    }
  }

  verReporte(reporte: Modalidad) {
    this.router.navigate(['/ver-reporte', reporte.id]);
  }

  loadTransferReports(): void {
    this.modalidadService.getModalidades().subscribe(
      (data: Modalidad[]) => {
        this.transferReportData = data.map(reporte => ({
          ...reporte,
          bienes: Array.isArray(reporte.bienes) ? reporte.bienes : []
        }));
        this.filteredTransferReportData = this.transferReportData;
      },
      error => console.error('Error al cargar reportes:', error)
    );
  }

  getCantidadBienes(reporte: Modalidad): number {
    return Array.isArray(reporte.bienes) ? reporte.bienes.length : 0;
  }

  loadCategorias(): void {
    this.categoriaService.getCategorias().subscribe(
      (data: Categoria[]) => this.categorias = data,
      error => console.error('Error al obtener categorías:', error)
    );
  }

  onUbicacionChange(): void {
    this.selectedAmbienteId = null;
    this.ambientesFiltrados = [];
  
    if (this.selectedUbicacionId) {
      this.ambienteService.getAmbientesByUbicacion(this.selectedUbicacionId).subscribe(
        (ambientes: Ambiente[]) => this.ambientesFiltrados = ambientes,
        error => console.error('Error al cargar ambientes:', error)
      );
    }
  
    this.buscarBienesPorUbicacion(); 
  }

  async generarPDF(consulta: ConsultaGenerada | null = null) {
    const bienes = consulta?.bienes || this.bienesFiltradosPorCategoria;
    if (bienes.length === 0) {
      return;
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const logo = await this.loadImage('cecomp.png');
    const fechaActual = this.normalizeDate(this.consultaDate);
    const fecha = consulta?.fechaConsulta || (fechaActual ? fechaActual.toLocaleDateString('es-PE') : 'Sin fecha');
    const direccion = consulta?.direccion || this.getDireccionNombre();
    const ubicacion = consulta?.ubicacion || this.getUbicacionNombre();
    const ambiente = consulta?.ambiente || this.getAmbienteNombre();
    const categoria = consulta?.categoria || this.getCategoriaNombre();

    if (logo) {
      doc.addImage(logo, 'PNG', 16, 15, 30, 15);
    }

    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.text('Universidad Nacional del Santa', 52, 18);
    doc.text('Direccion General de Administracion', 52, 24);
    doc.text('Oficina de Control Patrimonial', 52, 30);

    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    doc.text('REPORTE DE CONSULTA DE BIENES PATRIMONIALES', 105, 44, { align: 'center' });

    doc.setFont('times', 'normal');
    this.drawPdfField(doc, 'Direccion:', direccion, 16, 55, 68);
    this.drawPdfField(doc, 'Ubicacion:', ubicacion, 16, 65, 68);
    this.drawPdfField(doc, 'Ambiente:', ambiente, 16, 75, 68);
    this.drawPdfField(doc, 'Categoria:', categoria, 112, 55, 64);
    this.drawPdfField(doc, 'Fecha:', fecha, 112, 65, 64);
    this.drawPdfField(doc, 'Total:', String(bienes.length), 112, 75, 64);

    autoTable(doc, {
      startY: 92,
      head: [['Codigo Patrimonial', 'Categoria', 'Detalle Tecnico de los Bienes', 'Estado']],
      body: bienes.map(bien => [
        String(bien.codigo || ''),
        this.wrapPdfCellText(doc, bien.categoria?.NOMBRE_CATEGORIA || '', 18),
        this.wrapPdfCellText(doc, this.getDescripcionBien(bien), 98),
        bien.movimientos?.[0]?.ESTADO || 'Sin Estado'
      ]),
      theme: 'grid',
      styles: {
        font: 'times',
        fontSize: 8.2,
        cellPadding: 2.2,
        lineColor: [60, 60, 60],
        lineWidth: 0.15,
        overflow: 'linebreak',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [211, 47, 47],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 26, halign: 'center' },
        1: { cellWidth: 22, overflow: 'linebreak' },
        2: { cellWidth: 108, overflow: 'linebreak' },
        3: { cellWidth: 22, halign: 'center' }
      },
      margin: { left: 16, right: 16, bottom: 16 }
    });

    const totalPages = doc.getNumberOfPages();
    for (let page = 1; page <= totalPages; page++) {
      doc.setPage(page);
      doc.setFontSize(8);
      doc.text(`Pagina ${page} de ${totalPages}`, 194, 291, { align: 'right' });
    }

    doc.save('reporte-consulta.pdf');
    }

  verConsultaGenerada(consulta: ConsultaGenerada): void {
    this.consultaSeleccionadaId = consulta.id;
    this.bienesFiltrados = [...consulta.bienes];
    this.bienesFiltradosPorCategoria = [...consulta.bienes];
  }

  private registrarConsultaGenerada(): void {
    const consulta: ConsultaGenerada = {
      id: Date.now(),
      fechaGeneracion: new Date(),
      direccion: this.getDireccionNombre(),
      ubicacion: this.getUbicacionNombre(),
      ambiente: this.getAmbienteNombre(),
      categoria: this.getCategoriaNombre(),
      fechaConsulta: this.normalizeDate(this.consultaDate)?.toLocaleDateString('es-PE') || 'Sin fecha',
      bienes: [...this.bienesFiltradosPorCategoria]
    };

    this.consultaSeleccionadaId = consulta.id;
    this.consultasGeneradas = [consulta, ...this.consultasGeneradas].slice(0, 10);
  }

  private drawPdfField(doc: jsPDF, label: string, value: string, x: number, y: number, width: number): void {
    doc.setFont('times', 'bold');
    doc.setFontSize(8.8);
    doc.text(label, x, y + 4.5);
    doc.rect(x + 26, y, width, 8);
    doc.setFont('times', 'normal');
    doc.setFontSize(8.8);
    doc.text(doc.splitTextToSize(value || '-', width - 4).slice(0, 1), x + 28, y + 5.3);
  }

  private loadImage(src: string): Promise<HTMLImageElement | undefined> {
    return new Promise(resolve => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = () => resolve(undefined);
      image.src = src;
    });
  }

  private getDireccionNombre(): string {
    return this.direcciones.find(item => item.id === this.selectedDireccionId)?.nombre || 'Todas';
  }

  private getUbicacionNombre(): string {
    return this.ubicacionesFiltradas.find(item => item.ID_UBICACION === this.selectedUbicacionId)?.NOMBRE || 'Todas';
  }

  private getAmbienteNombre(): string {
    return this.ambientesFiltrados.find(item => item.ID_AMBIENTE === this.selectedAmbienteId)?.NOMBRE_AMBIENTE || 'Todos';
  }

  private getCategoriaNombre(): string {
    return this.selectedCategoria?.NOMBRE_CATEGORIA || 'Todas';
  }

  private normalizeDate(value: Date | string | null): Date | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return value;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private filtrarBienesPorAmbienteEnFecha(bienes: Bien[], idAmbiente: number, fecha: Date): Bien[] {
    const fechaObjetivo = this.endOfDay(fecha).getTime();

    return bienes
      .map(bien => {
        const movimientos = [...(bien.movimientos || [])].sort((a, b) =>
          new Date(a.FECHA_MODIFICACION).getTime() - new Date(b.FECHA_MODIFICACION).getTime()
        );

        if (movimientos.length === 0) {
          return bien;
        }

        const movimientoVigente = movimientos
          .filter(movimiento => new Date(movimiento.FECHA_MODIFICACION).getTime() <= fechaObjetivo)
          .pop();

        if (!movimientoVigente || movimientoVigente.ID_AMBIENTE !== idAmbiente) {
          return null;
        }

        return new Bien(
          bien.id,
          bien.codigo,
          bien.ID_CATEGORIA,
          bien.ID_USUARIO,
          bien.DESCRIPCION,
          bien.FECHA_INGRESO,
          bien.DIMENSION,
          bien.MODELO,
          bien.NUMERO_SERIE,
          bien.TIPO,
          bien.COLOR,
          bien.categoria,
          [movimientoVigente, ...movimientos.filter(movimiento => movimiento.id !== movimientoVigente.id)],
          bien.usuario
        );
      })
      .filter((bien): bien is Bien => !!bien);
  }

  private getDescripcionBien(bien: Bien): string {
    return [
      bien.DESCRIPCION,
      bien.DIMENSION ? `Dimension: ${bien.DIMENSION}` : '',
      bien.MODELO ? `Modelo: ${bien.MODELO}` : '',
      bien.NUMERO_SERIE ? `Serie: ${bien.NUMERO_SERIE}` : '',
      bien.TIPO ? `Tipo: ${bien.TIPO}` : '',
      bien.COLOR ? `Color: ${bien.COLOR}` : ''
    ].filter(Boolean).join(' | ');
  }

  private wrapPdfCellText(doc: jsPDF, value: string, width: number): string {
    return doc.splitTextToSize((value || '').replace(/\s+/g, ' ').trim(), width).join('\n');
  }

  getDescripcionConsulta(bien: Bien): string {
    return this.getDescripcionBien(bien) || 'Sin descripcion';
  }

  getCategoriaBien(bien: Bien): string {
    return bien.categoria?.NOMBRE_CATEGORIA || 'Sin categoria';
  }

  getEstadoBien(bien: Bien): string {
    return bien.movimientos?.[0]?.ESTADO || 'Sin Estado';
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  }

  private endOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  }
}
