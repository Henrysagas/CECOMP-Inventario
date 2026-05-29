import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, map, of } from 'rxjs';
import { ModalidadService } from '../services/modalidad.service';
import { Modalidad } from '../models/modalidad';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
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
import { TipoModalidad } from '../models/tipo-modalidad';
import { TipoModalidadService } from '../services/tipo-modalidad.service';
import { LogVisitaService } from '../services/log-visita.service';
import { AuthService } from '../auth.service';
import { ObservacionBien } from '../models/observacion-bien';
import { ObservacionBienService } from '../services/observacion-bien.service';

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
    NzInputModule,
    NzPaginationModule
  ],
  templateUrl: './reporte.component.html',
  styleUrls: ['./reporte.component.css']
})
export class ReporteComponent implements OnInit {

  canGenerateReports = false;
  
  transferReportData: Modalidad[] = [];
  filteredTransferReportData: Modalidad[] = [];
  dateRangeTransferencia: Date[] | null = null;
  selectedTipoTransferencia: number | null = null;
  transferenciaSearchTerm = '';
  cargandoTransferencias = false;
  errorTransferencias = '';
  cargandoConsulta = false;
  errorConsulta = '';
  tipoModalidades: TipoModalidad[] = [];

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
  observacionesReportadas: ObservacionBien[] = [];
  observacionesFiltradas: ObservacionBien[] = [];
  tiposObservacion: string[] = [];
  selectedTipoObservacion: string | null = null;
  selectedCategoriaObservacionId: number | null = null;
  observacionSearchTerm = '';
  selectedObservacionIds = new Set<number>();
  cargandoObservaciones = false;
  errorObservaciones = '';

  constructor(
    private router: Router, 
    private modalidadService: ModalidadService,
    private categoriaService: CategoriaService,
    private direccionesService: DireccionesService,
    private ubicacionService: UbicacionService,
    private bienService: BienService,
    private ambienteService: AmbienteService,
    private tipoModalidadService: TipoModalidadService,
    private logVisitaService: LogVisitaService,
    private authService: AuthService,
    private observacionBienService: ObservacionBienService
  ) {}

  ngOnInit(): void {
    this.authService.currentRole$.subscribe(role => {
      this.canGenerateReports = this.authService.canGenerateTransferReports(role);
    });
    this.consultaDate = new Date();
    this.loadTransferReports();
    this.loadDirecciones();
    this.loadUbicaciones(); 
    this.loadAmbientes(); 
    this.loadCategorias(); 
    this.loadTipoModalidades();
    this.loadObservaciones();
  }
  buscarBienesPorUbicacion(registrarConsulta: boolean = false): void {
    if (!this.selectedAmbienteId) {
      this.bienesFiltrados = [];
      this.bienesFiltradosPorCategoria = [];
      this.errorConsulta = 'Selecciona una ubicacion y un ambiente para consultar bienes.';
      return;
    }
  
    const fechaConsulta = this.normalizeDate(this.consultaDate) || new Date();
    this.cargandoConsulta = true;
    this.errorConsulta = '';
  
    this.bienService.getBienes().subscribe(
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

        this.bienesFiltrados = this.filtrarBienesPorAmbienteEnFecha(
          bienesNormalizados,
          this.selectedAmbienteId!,
          fechaConsulta
        );

        this.aplicarFiltroCategoria(); // Aplica el filtro luego de cargar los bienes
        if (registrarConsulta) {
          this.registrarConsultaGenerada();
          this.registrarLogConsultaReporte();
        }
        this.cargandoConsulta = false;
      },
      error => {
        console.error('Error al obtener bienes:', error);
        this.errorConsulta = 'No se pudieron cargar los bienes de la consulta.';
        this.cargandoConsulta = false;
      }
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
    if (!this.canGenerateReports) {
      return;
    }

    if (tipo === 'transferencia') {
      this.router.navigate(['/transferencia']);
    } else {
      this.buscarBienesPorUbicacion(true);
    }
  }

  loadDirecciones(): void {
    this.direccionesService.getDirecciones().subscribe(
      (direcciones: DireccionModel[]) => {
        this.direcciones = direcciones;
        this.preseleccionarConsultaCecomp();
      },
      error => console.error('Error al cargar direcciones:', error)
    );
  }
  

  loadUbicaciones(): void {
    this.ubicacionService.getUbicaciones().subscribe(
      (ubicaciones: Ubicacion[]) => {
        this.ubicaciones = ubicaciones;
        this.preseleccionarConsultaCecomp();
      },
      error => console.error('Error al cargar ubicaciones:', error)
    );
  }

  loadAmbientes(): void {
    this.ambienteService.getAmbientes().subscribe(
      (ambientes: Ambiente[]) => this.ambientes = ambientes,
      error => console.error('Error al cargar ambientes:', error)
    );
  }

  private preseleccionarConsultaCecomp(): void {
    if (this.selectedDireccionId || this.direcciones.length === 0) {
      return;
    }

    const campusUno = this.direcciones.find(direccion => this.normalizarTexto(direccion.nombre).includes('campus 1'));
    if (!campusUno) {
      return;
    }

    this.selectedDireccionId = campusUno.id;
    this.ubicacionService.getUbicacionesByDireccion(campusUno.id).subscribe(
      (ubicaciones: Ubicacion[]) => {
        this.ubicacionesFiltradas = ubicaciones;
        const cecomp = ubicaciones.find(ubicacion => {
          const texto = this.normalizarTexto(`${ubicacion.NOMBRE || ''} ${ubicacion.CODIGO || ''}`);
          return texto.includes('cecomp');
        });

        if (!cecomp) {
          return;
        }

        this.selectedUbicacionId = cecomp.ID_UBICACION;
        this.ambienteService.getAmbientesByUbicacion(cecomp.ID_UBICACION).subscribe(
          (ambientes: Ambiente[]) => this.ambientesFiltrados = ambientes,
          error => console.error('Error al cargar ambientes:', error)
        );
      },
      error => console.error('Error al cargar ubicaciones:', error)
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
      this.aplicarFiltrosTransferencia();
    }
  }

  aplicarFiltrosTransferencia(): void {
    let reportes = [...this.transferReportData];
    const termino = this.normalizarTexto(this.transferenciaSearchTerm || '');

    if (this.dateRangeTransferencia && this.dateRangeTransferencia.length === 2) {
      const [startDate, endDate] = this.dateRangeTransferencia;
      const start = this.startOfDay(startDate);
      const end = this.endOfDay(endDate);
      reportes = reportes.filter((reporte) => {
        const reportDate = new Date(reporte.fecha);
        return reportDate >= start && reportDate <= end;
      });
    }

    if (this.selectedTipoTransferencia) {
      reportes = reportes.filter(reporte => reporte.ID_TIPO_MODALIDAD === this.selectedTipoTransferencia);
    }

    if (termino) {
      reportes = reportes.filter(reporte => {
        const fecha = new Date(reporte.fecha);
        const textoReporte = this.normalizarTexto([
          reporte.nombre,
          reporte.documento_autorizacion,
          reporte.motivo_traslado,
          this.getTipoModalidadNombre(reporte.ID_TIPO_MODALIDAD),
          reporte.ID_TIPO_MODALIDAD,
          Number.isNaN(fecha.getTime()) ? reporte.fecha : this.formatDate(fecha),
          Number.isNaN(fecha.getTime()) ? '' : fecha.toLocaleDateString('es-PE')
        ].join(' '));

        return textoReporte.includes(termino);
      });
    }

    this.filteredTransferReportData = reportes;
  }

  verReporte(reporte: Modalidad) {
    this.router.navigate(['/ver-reporte', reporte.id]);
  }

  loadTransferReports(): void {
    this.cargandoTransferencias = true;
    this.errorTransferencias = '';
    this.modalidadService.getModalidades().subscribe(
      (data: Modalidad[]) => {
        const reportes = data.map(reporte => ({
          ...reporte,
          bienes: Array.isArray(reporte.bienes) ? reporte.bienes : []
        }));

        if (reportes.length === 0) {
          this.transferReportData = [];
          this.aplicarFiltrosTransferencia();
          this.cargandoTransferencias = false;
          return;
        }

        forkJoin(
          reportes.map(reporte =>
            this.modalidadService.getBienesPorModalidad(reporte.id || 0).pipe(
              map(bienes => ({
                ...reporte,
                bienes: Array.isArray(bienes) ? bienes : []
              })),
              catchError(error => {
                console.error('Error al cargar bienes de la modalidad:', error);
                return of(reporte);
              })
            )
          )
        ).subscribe((reportesConBienes: Modalidad[]) => {
          this.transferReportData = reportesConBienes;
          this.aplicarFiltrosTransferencia();
          this.cargandoTransferencias = false;
        });
      },
      error => {
        console.error('Error al cargar reportes:', error);
        this.errorTransferencias = 'No se pudieron cargar los reportes de transferencia.';
        this.cargandoTransferencias = false;
      }
    );
  }

  loadTipoModalidades(): void {
    this.tipoModalidadService.getTiposModalidad().subscribe(
      (data: TipoModalidad[]) => this.tipoModalidades = data,
      error => console.error('Error al cargar tipos de modalidad:', error)
    );
  }

  getCantidadBienes(reporte: Modalidad): number {
    return Array.isArray(reporte.bienes) ? reporte.bienes.length : 0;
  }

  getTipoModalidadNombre(tipoId: number | null | undefined): string {
    if (!tipoId) {
      return 'No registrado';
    }

    return this.tipoModalidades.find(tipo => tipo.id === tipoId)?.nombre || `Tipo ${tipoId}`;
  }

  getCantidadPorTipo(tipo: 'interna' | 'externa' | 'patrimonio'): number {
    return this.filteredTransferReportData.filter(reporte => this.getCategoriaTipoTransferencia(reporte) === tipo).length;
  }

  private getCategoriaTipoTransferencia(reporte: Modalidad): 'interna' | 'externa' | 'patrimonio' | 'otro' {
    const tipoId = reporte.ID_TIPO_MODALIDAD;
    const nombre = this.getTipoModalidadNombre(tipoId).toLowerCase();

    if (nombre.includes('interna') || tipoId === 2) {
      return 'interna';
    }

    if (nombre.includes('externa') || tipoId === 3) {
      return 'externa';
    }

    if (nombre.includes('patrimonio') || tipoId === 4) {
      return 'patrimonio';
    }

    return 'otro';
  }

  loadCategorias(): void {
    this.categoriaService.getCategorias().subscribe(
      (data: Categoria[]) => this.categorias = data,
      error => console.error('Error al obtener categorías:', error)
    );
  }

  loadObservaciones(): void {
    this.cargandoObservaciones = true;
    this.errorObservaciones = '';

    this.observacionBienService.getObservaciones().subscribe(
      (observaciones: ObservacionBien[]) => {
        this.observacionesReportadas = observaciones;
        this.tiposObservacion = Array.from(new Set(
          observaciones
            .map(observacion => (observacion.tipo_evento || '').trim())
            .filter(Boolean)
        )).sort((a, b) => a.localeCompare(b, 'es'));
        this.aplicarFiltrosObservaciones();
        this.cargandoObservaciones = false;
      },
      error => {
        console.error('Error al cargar observaciones:', error);
        this.errorObservaciones = 'No se pudieron cargar las observaciones reportadas.';
        this.cargandoObservaciones = false;
      }
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

    this.logVisitaService.registrarAccionLimitada('descargar pdf de reporte de consulta', '/reportes', {
      consulta_id: consulta?.id ?? this.consultaSeleccionadaId,
      ambiente: consulta?.ambiente || this.getAmbienteNombre(),
      categoria: consulta?.categoria || this.getCategoriaNombre(),
      total_bienes: bienes.length
    }, 60000).subscribe();

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

  async generarPDFObservaciones(): Promise<void> {
    const observacionesSeleccionadas = this.getObservacionesSeleccionadasFiltradas();
    const observaciones = observacionesSeleccionadas.length > 0
      ? observacionesSeleccionadas
      : this.observacionesFiltradas;

    if (observaciones.length === 0) {
      return;
    }

    this.logVisitaService.registrarAccionLimitada('descargar pdf de reporte de observaciones', '/reportes', {
      total_observaciones: observaciones.length,
      tipo_observacion: this.selectedTipoObservacion || 'Todos',
      categoria: this.getCategoriaObservacionSeleccionadaNombre(),
      busqueda: this.observacionSearchTerm || '',
      seleccionadas: observacionesSeleccionadas.length
    }, 60000).subscribe();

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const logo = await this.loadImage('cecomp.png');

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
    doc.text('REPORTE DE OBSERVACIONES DE BIENES', 105, 44, { align: 'center' });

    doc.setFont('times', 'normal');
    this.drawPdfField(doc, 'Fecha:', new Date().toLocaleDateString('es-PE'), 16, 55, 68);
    this.drawPdfField(doc, 'Total:', String(observaciones.length), 112, 55, 64);
    this.drawPdfField(doc, 'Tipo:', this.selectedTipoObservacion || 'Todos', 16, 65, 68);
    this.drawPdfField(doc, 'Categoria:', this.getCategoriaObservacionSeleccionadaNombre(), 112, 65, 64);
    this.drawPdfField(doc, 'Busqueda:', this.observacionSearchTerm || 'Sin filtro', 16, 75, 160);

    autoTable(doc, {
      startY: 92,
      head: [['ID Bien', 'Categoria', 'Tipo de Observacion', 'Observacion']],
      body: observaciones.map(observacion => [
        this.getObservacionBienId(observacion),
        this.wrapPdfCellText(doc, this.getObservacionCategoria(observacion), 26),
        this.wrapPdfCellText(doc, observacion.tipo_evento || 'Sin tipo', 36),
        this.wrapPdfCellText(doc, observacion.observacion || 'Sin observacion', 86)
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
        0: { cellWidth: 24, halign: 'center' },
        1: { cellWidth: 30, overflow: 'linebreak' },
        2: { cellWidth: 40, overflow: 'linebreak' },
        3: { cellWidth: 84, overflow: 'linebreak' }
      },
      margin: { left: 16, right: 16, bottom: 16 }
    });

    const totalPages = doc.getNumberOfPages();
    for (let page = 1; page <= totalPages; page++) {
      doc.setPage(page);
      doc.setFontSize(8);
      doc.text(`Pagina ${page} de ${totalPages}`, 194, 291, { align: 'right' });
    }

    doc.save('reporte-observaciones.pdf');
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

  private registrarLogConsultaReporte(): void {
    this.logVisitaService.registrarAccionLimitada('consulta de reporte', '/reportes', {
      direccion: this.getDireccionNombre(),
      ubicacion: this.getUbicacionNombre(),
      ambiente: this.getAmbienteNombre(),
      categoria: this.getCategoriaNombre(),
      fecha_consulta: this.normalizeDate(this.consultaDate)?.toLocaleDateString('es-PE') || 'Sin fecha',
      total_bienes: this.bienesFiltradosPorCategoria.length
    }, 60000).subscribe();
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

  private normalizarTexto(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private filtrarBienesPorAmbienteEnFecha(bienes: Bien[], idAmbiente: number, fecha: Date): Bien[] {
    const fechaObjetivo = this.endOfDay(fecha).getTime();

    return bienes
      .map(bien => {
        const movimientos = [...(bien.movimientos || [])].sort((a, b) =>
          this.getMovimientoTime(a.FECHA_MODIFICACION) - this.getMovimientoTime(b.FECHA_MODIFICACION)
        );

        if (movimientos.length === 0) {
          return null;
        }

        const movimientoVigente = movimientos
          .filter(movimiento => this.getMovimientoTime(movimiento.FECHA_MODIFICACION) <= fechaObjetivo)
          .pop();

        if (!movimientoVigente || Number(movimientoVigente.ID_AMBIENTE) !== Number(idAmbiente)) {
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

  private getMovimientoTime(fecha: string): number {
    const parsed = this.normalizeDate(fecha);
    return parsed ? parsed.getTime() : 0;
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

  getObservacionBienId(observacion: ObservacionBien): string {
    return String(observacion.bien?.codigo || observacion.ID_BIEN || 'Sin ID');
  }

  getObservacionCategoria(observacion: ObservacionBien): string {
    const bien = observacion.bien;
    return bien?.categoria?.NOMBRE_CATEGORIA ||
      this.categorias.find(categoria => categoria.id === bien?.ID_CATEGORIA)?.NOMBRE_CATEGORIA ||
      'Sin categoria';
  }

  aplicarFiltrosObservaciones(): void {
    const termino = this.normalizarTexto(this.observacionSearchTerm || '');

    this.observacionesFiltradas = this.observacionesReportadas.filter(observacion => {
      const coincideTipo = !this.selectedTipoObservacion || observacion.tipo_evento === this.selectedTipoObservacion;
      const coincideCategoria = !this.selectedCategoriaObservacionId ||
        this.getObservacionCategoriaId(observacion) === this.selectedCategoriaObservacionId;

      if (!coincideTipo || !coincideCategoria) {
        return false;
      }

      if (!termino) {
        return true;
      }

      const texto = this.normalizarTexto([
        observacion.id,
        observacion.ID_BIEN,
        this.getObservacionBienId(observacion),
        this.getObservacionCategoria(observacion),
        observacion.tipo_evento,
        observacion.observacion,
        observacion.fecha_evento
      ].join(' '));

      return texto.includes(termino);
    });
  }

  toggleObservacionSeleccionada(observacion: ObservacionBien, checked: boolean): void {
    if (checked) {
      this.selectedObservacionIds.add(observacion.id);
    } else {
      this.selectedObservacionIds.delete(observacion.id);
    }
  }

  toggleObservacionesFiltradas(checked: boolean): void {
    this.observacionesFiltradas.forEach(observacion => {
      if (checked) {
        this.selectedObservacionIds.add(observacion.id);
      } else {
        this.selectedObservacionIds.delete(observacion.id);
      }
    });
  }

  estaObservacionSeleccionada(observacion: ObservacionBien): boolean {
    return this.selectedObservacionIds.has(observacion.id);
  }

  estanTodasObservacionesFiltradasSeleccionadas(): boolean {
    return this.observacionesFiltradas.length > 0 &&
      this.observacionesFiltradas.every(observacion => this.selectedObservacionIds.has(observacion.id));
  }

  hayObservacionesFiltradasSeleccionadas(): boolean {
    return this.getObservacionesSeleccionadasFiltradas().length > 0;
  }

  getCantidadObservacionesParaPdf(): number {
    const seleccionadas = this.getObservacionesSeleccionadasFiltradas().length;
    return seleccionadas > 0 ? seleccionadas : this.observacionesFiltradas.length;
  }

  getObservacionesSeleccionadasFiltradas(): ObservacionBien[] {
    return this.observacionesFiltradas.filter(observacion => this.selectedObservacionIds.has(observacion.id));
  }

  private getObservacionCategoriaId(observacion: ObservacionBien): number | null {
    const bien = observacion.bien;
    const categoriaId = bien?.ID_CATEGORIA || bien?.categoria?.id;

    if (categoriaId) {
      return Number(categoriaId);
    }

    const categoriaNombre = this.normalizarTexto(this.getObservacionCategoria(observacion));
    return this.categorias.find(categoria =>
      this.normalizarTexto(categoria.NOMBRE_CATEGORIA) === categoriaNombre
    )?.id || null;
  }

  getCategoriaObservacionSeleccionadaNombre(): string {
    if (!this.selectedCategoriaObservacionId) {
      return 'Todas';
    }

    return this.categorias.find(categoria => categoria.id === this.selectedCategoriaObservacionId)?.NOMBRE_CATEGORIA || 'Todas';
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  }

  private endOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  }
}
