import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTableModule } from 'ng-zorro-antd/table';
import { Ambiente } from '../models/ambiente';
import { BienModalidad } from '../models/bien-modalidad';
import { Modalidad } from '../models/modalidad';
import { Ubicacion } from '../models/ubicacion';
import { AmbienteService } from '../services/ambiente.service';
import { BienModalidadService } from '../services/bien-modalidad.service';
import { ModalidadService } from '../services/modalidad.service';
import { UbicacionService } from '../services/ubicacion.service';
import { LogVisitaService } from '../services/log-visita.service';
import { DocumentoConfig, DocumentoConfigService } from '../services/documento-config.service';
import { CategoriaService } from '../services/categoria.service';
import { Categoria } from '../models/categoria';

@Component({
  selector: 'app-ver-reporte',
  templateUrl: './ver-reporte.component.html',
  styleUrls: ['./ver-reporte.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule, NzTableModule, NzGridModule, NzDividerModule]
})
export class VerReporteComponent implements OnInit {
  reporte?: Modalidad;
  ubicacion?: Ubicacion;
  ambiente?: Ambiente;
  bienesFiltrados: BienModalidad[] = [];
  categorias: Categoria[] = [];

  private readonly pdfMargin = 10;
  private readonly pdfPageWidth = 210;
  private readonly pdfPageHeight = 297;
  private readonly pdfLineColor: [number, number, number] = [35, 35, 35];
  private documentoConfig: DocumentoConfig;

  constructor(
    private modalidadService: ModalidadService,
    private ubicacionService: UbicacionService,
    private ambienteService: AmbienteService,
    private bienModalidadService: BienModalidadService,
    private route: ActivatedRoute,
    private router: Router,
    private logVisitaService: LogVisitaService,
    private documentoConfigService: DocumentoConfigService,
    private categoriaService: CategoriaService
  ) {
    this.documentoConfig = this.documentoConfigService.getConfig();
  }

  ngOnInit(): void {
    this.loadCategorias();
    this.loadReporte();
  }

  loadCategorias(): void {
    this.categoriaService.getCategorias().subscribe(
      categorias => this.categorias = categorias,
      error => console.error('Error al cargar categorias:', error)
    );
  }

  loadReporte(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.modalidadService.getModalidades().subscribe((data: Modalidad[]) => {
      this.reporte = data.find(reporte => reporte.id === id);

      if (!this.reporte) {
        console.error(`No se encontro el reporte con ID ${id}`);
        return;
      }

      if (this.reporte.ID_PROCEDENCIA) {
        this.ubicacionService.getUbicacion(this.reporte.ID_PROCEDENCIA).subscribe(ubicacion => {
          this.ubicacion = ubicacion;
        });
      }

      if (this.reporte.ID_DESTINO) {
        this.ambienteService.getAmbiente(this.reporte.ID_DESTINO).subscribe(ambiente => {
          this.ambiente = ambiente;
        });
      }

      this.loadBienes();
    }, error => {
      console.error('Error al cargar el reporte:', error);
    });
  }

  loadBienes(): void {
    if (this.reporte && this.reporte.id !== undefined) {
      this.bienModalidadService.getBienesPorModalidad(this.reporte.id).subscribe((bienModalidades: BienModalidad[]) => {
        this.bienesFiltrados = bienModalidades;
      }, error => {
        console.error('Error al cargar los bienes:', error);
      });
    } else {
      console.error('ID de reporte es indefinido');
    }
  }

  volver(): void {
    this.router.navigate(['/reportes']);
  }

  getCaracteristicasBien(bienModalidad: BienModalidad): string {
    const bien = bienModalidad.bien;
    if (!bien) {
      return 'Sin caracteristicas';
    }

    const partes = [
      bien.categoria?.NOMBRE_CATEGORIA,
      bien.DESCRIPCION,
      bien.DIMENSION ? `Dimension: ${bien.DIMENSION}` : '',
      bien.MODELO ? `Modelo: ${bien.MODELO}` : '',
      bien.NUMERO_SERIE ? `Serie: ${bien.NUMERO_SERIE}` : '',
      bien.TIPO ? `Tipo: ${bien.TIPO}` : '',
      bien.COLOR ? `Color: ${bien.COLOR}` : ''
    ].filter(Boolean);

    return partes.join(' | ') || 'Sin caracteristicas';
  }

  getCodigoBien(bienModalidad: BienModalidad): string {
    return String(bienModalidad.bien?.codigo || 'Sin codigo');
  }

  async generarPDF(): Promise<void> {
    if (!this.reporte) {
      return;
    }

    if (this.esReporteInterno()) {
      await this.generarPDFReporteInterno();
      return;
    }

    this.logVisitaService.registrarAccionLimitada('descargar pdf de reporte de transferencia', `/ver-reporte/${this.reporte.id}`, {
      reporte_id: this.reporte.id,
      cantidad_bienes: this.bienesFiltrados.length
    }, 60000).subscribe();

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const logo = await this.loadImage('cecomp.png');
    doc.setFont('times', 'normal');

    this.drawReportHeader(doc, logo);

    autoTable(doc, {
      head: [
        [
          { content: 'Codigo\nPatrimonial', rowSpan: 2 },
          { content: 'Detalle Tecnico de los Bienes', rowSpan: 2 },
          { content: 'Cant.', rowSpan: 2 },
          { content: 'Estado Conserv.', colSpan: 5 }
        ],
        ['Nuevo', 'Bueno', 'Regular', 'Malo', 'RAEE/\nChatarra']
      ],
      body: this.getPdfRows(doc),
      startY: 120,
      margin: { top: 12, right: this.pdfMargin, bottom: 14, left: this.pdfMargin },
      theme: 'grid',
      styles: {
        font: 'times',
        fontSize: 7.2,
        cellPadding: { top: 1.7, right: 1.6, bottom: 1.7, left: 1.6 },
        lineColor: this.pdfLineColor,
        lineWidth: 0.25,
        textColor: [0, 0, 0],
        overflow: 'linebreak',
        valign: 'middle'
      },
      rowPageBreak: 'avoid',
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 6.4,
        halign: 'center',
        valign: 'middle',
        lineWidth: 0.3
      },
      bodyStyles: {
        minCellHeight: 9.5
      },
      columnStyles: this.getPdfColumnStyles()
    });

    this.drawSignaturesAtDocumentEnd(doc, (doc as any).lastAutoTable?.finalY ?? 90);
    this.addPageNumbers(doc);

    doc.save(`reporte-${this.reporte.id ?? 'bienes'}.pdf`);
  }

  esReporteInterno(): boolean {
    return this.reporte?.ID_TIPO_MODALIDAD === 2;
  }

  private async generarPDFReporteInterno(): Promise<void> {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const logo = await this.loadImage('cecomp.png');
    const fecha = this.formatDate(this.reporte?.fecha);
    const ubicacion = this.ubicacion?.NOMBRE || this.documentoConfig.ubicacionCecomp;
    const ambiente = this.ambiente?.NOMBRE_AMBIENTE || 'Sin ambiente';

    this.logVisitaService.registrarAccionLimitada('descargar pdf de reporte interno', `/ver-reporte/${this.reporte?.id}`, {
      reporte_id: this.reporte?.id,
      cantidad_bienes: this.bienesFiltrados.length
    }, 60000).subscribe();

    if (logo) {
      doc.addImage(logo, 'PNG', 16, 15, 30, 15);
    }

    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.text(this.documentoConfig.institucion, 52, 18);
    doc.text(this.documentoConfig.dependencia, 52, 24);
    doc.text(this.documentoConfig.oficina, 52, 30);

    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    doc.text(this.documentoConfig.tituloMovimientoInterno, 105, 44, { align: 'center' });

    doc.setFont('times', 'normal');
    this.drawConsultaPdfField(doc, 'Ubicacion:', ubicacion, 16, 55, 68);
    this.drawConsultaPdfField(doc, 'Ambiente:', ambiente, 16, 65, 68);
    this.drawConsultaPdfField(doc, 'Categoria:', 'Todas', 112, 55, 64);
    this.drawConsultaPdfField(doc, 'Fecha:', fecha, 112, 65, 64);
    this.drawConsultaPdfField(doc, 'Total:', String(this.bienesFiltrados.length), 112, 75, 64);

    autoTable(doc, {
      startY: 92,
      head: [['Codigo Patrimonial', 'Categoria', 'Detalle Tecnico de los Bienes', 'Estado']],
      body: this.bienesFiltrados.map(bienModalidad => [
        String(bienModalidad.bien?.codigo || ''),
        this.wrapConsultaPdfCellText(doc, this.getCategoriaBienModalidad(bienModalidad), 18),
        this.wrapConsultaPdfCellText(doc, this.getCaracteristicasBienPdf(bienModalidad), 98),
        bienModalidad.estado || 'Sin Estado'
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

    doc.save(`reporte-interno-${this.reporte?.id ?? 'bienes'}.pdf`);
  }

  private getPdfRows(doc: jsPDF): string[][] {
    const rows = this.bienesFiltrados.map(bienModalidad => {
      const estado = (bienModalidad.estado || '').toLowerCase();
      const detalle = this.wrapPdfText(doc, this.getCaracteristicasBienPdf(bienModalidad), 101);

      return [
        String(bienModalidad.bien?.codigo || ''),
        detalle,
        '1',
        estado === 'nuevo' ? 'X' : '',
        estado === 'bueno' ? 'X' : '',
        estado === 'regular' ? 'X' : '',
        estado === 'malo' ? 'X' : '',
        estado.includes('raee') || estado.includes('chatarra') ? 'X' : ''
      ];
    });

    while (rows.length < 8) {
      rows.push(['', '', '', '', '', '', '', '']);
    }

    return rows;
  }

  private getPdfColumnStyles(): Record<number, any> {
    return {
      0: { cellWidth: 27, halign: 'center' },
      1: { cellWidth: 106, overflow: 'linebreak' },
      2: { cellWidth: 8, halign: 'center' },
      3: { cellWidth: 9, halign: 'center' },
      4: { cellWidth: 9, halign: 'center' },
      5: { cellWidth: 11, halign: 'center' },
      6: { cellWidth: 9, halign: 'center' },
      7: { cellWidth: 11, halign: 'center' }
    };
  }

  private getCaracteristicasBienPdf(bienModalidad: BienModalidad): string {
    const bien = bienModalidad.bien;
    if (!bien) {
      return 'Sin caracteristicas';
    }

    const partes = [
      bien.DESCRIPCION,
      bien.DIMENSION ? `Dimension: ${bien.DIMENSION}` : '',
      bien.MODELO ? `Modelo: ${bien.MODELO}` : '',
      bien.NUMERO_SERIE ? `Serie: ${bien.NUMERO_SERIE}` : '',
      bien.TIPO ? `Tipo: ${bien.TIPO}` : '',
      bien.COLOR ? `Color: ${bien.COLOR}` : ''
    ].filter(Boolean);

    return this.normalizePdfText(partes.join(' | ') || 'Sin caracteristicas');
  }

  private getCategoriaBienModalidad(bienModalidad: BienModalidad): string {
    const bien = bienModalidad.bien;
    return bien?.categoria?.NOMBRE_CATEGORIA ||
      this.categorias.find(categoria => categoria.id === bien?.ID_CATEGORIA)?.NOMBRE_CATEGORIA ||
      'Sin categoria';
  }

  private normalizePdfText(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }

  private wrapPdfText(doc: jsPDF, value: string, width: number): string {
    return this.normalizePdfText(value)
      .split('|')
      .map(part => part.trim())
      .filter(Boolean)
      .flatMap(part => doc.splitTextToSize(part, width))
      .join('\n');
  }

  private extendTableToSignatures(doc: jsPDF, tableFinalY: number): number {
    const signatureBlockHeight = 60;
    const signatureTopY = this.pdfPageHeight - this.pdfMargin - signatureBlockHeight;
    const minimumGap = 6;
    const targetY = signatureTopY - minimumGap;
    const emptyRowHeight = 9.5;
    const availableHeight = targetY - tableFinalY;
    const emptyRows = Math.floor(availableHeight / emptyRowHeight);

    if (emptyRows <= 0) {
      return tableFinalY;
    }

    this.drawEmptyTableRows(doc, tableFinalY, emptyRows, emptyRowHeight);

    return (doc as any).lastAutoTable?.finalY ?? tableFinalY;
  }

  private drawEmptyTableRows(doc: jsPDF, startY: number, rowCount: number, rowHeight = 8): void {
    if (rowCount <= 0) {
      return;
    }

    autoTable(doc, {
      body: Array.from({ length: rowCount }, () => ['', '', '', '', '', '', '', '']),
      startY,
      margin: { top: 12, right: this.pdfMargin, bottom: 14, left: this.pdfMargin },
      theme: 'grid',
      showHead: 'never',
      styles: {
        font: 'times',
        fontSize: 7.2,
        cellPadding: { top: 1.7, right: 1.6, bottom: 1.7, left: 1.6 },
        lineColor: this.pdfLineColor,
        lineWidth: 0.25,
        textColor: [0, 0, 0],
        overflow: 'linebreak',
        valign: 'middle'
      },
      rowPageBreak: 'avoid',
      bodyStyles: {
        minCellHeight: rowHeight
      },
      columnStyles: this.getPdfColumnStyles()
    });
  }

  private drawReportHeader(doc: jsPDF, logo?: HTMLImageElement): void {
    const left = this.pdfMargin;
    const top = 9;
    const width = this.pdfPageWidth - this.pdfMargin * 2;
    const pageCenter = this.pdfPageWidth / 2;
    const fieldX = 68;
    const fieldRight = left + width - 7;
    const fieldWidth = fieldRight - fieldX;
    const dateLabelX = 122;
    const dateFieldX = 156;

    doc.setDrawColor(...this.pdfLineColor);
    doc.setLineWidth(0.3);

    if (logo) {
      doc.addImage(logo, 'PNG', left + 2, top + 7, 30, 15);
    }

    doc.setFont('times', 'normal');
    doc.setFontSize(7);
    doc.text('Universidad Nacional del Santa', left + 38, top + 8);
    doc.text('Direccion General de Administracion', left + 38, top + 14);
    doc.text('Oficina de Control Patrimonial', left + 38, top + 20);

    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text('ORDEN DE DESPLAZAMIENTO INTERNO DE BIENES PATRIMONIALES', pageCenter, top + 27, { align: 'center' });
    doc.setFontSize(8);
    doc.text('No. ................', pageCenter, top + 34, { align: 'center' });

    doc.setFontSize(7);
    doc.text('Oficina de Procedencia:', left, 52);
    this.drawValueBox(doc, fieldX, 48, 50, 7, this.reporte?.nombre || this.ubicacion?.NOMBRE || '');
    doc.text('Fecha recepcion Doc.:', dateLabelX, 52);
    this.drawValueBox(doc, dateFieldX, 48, fieldRight - dateFieldX, 7, this.formatDate(this.reporte?.fecha));

    doc.text('Documento de Autorizacion:', left, 64);
    this.drawValueBox(doc, fieldX, 60, fieldWidth, 7, this.reporte?.documento_autorizacion || '');

    doc.text('Oficina y/o Entidad Destino:', left, 76);
    this.drawValueBox(doc, fieldX, 72, fieldWidth, 7, this.ambiente?.NOMBRE_AMBIENTE || '');

    doc.text('Ubicacion y/o Direccion:', left, 88);
    this.drawValueBox(doc, fieldX, 84, fieldWidth, 7, this.ubicacion?.NOMBRE || '');

    doc.text('Motivo del Traslado:', left, 101);
    this.drawMotivoOptions(doc, 42, 94);
    doc.setFont('times', 'normal');
    doc.setFontSize(6.5);
    doc.text('(a), (b), (c), (d), (e) y (f) Indicar:', left + 87, 114);
  }

  private drawValueBox(doc: jsPDF, x: number, y: number, width: number, height: number, value: string): void {
    doc.rect(x, y, width, height);
    doc.setFont('times', 'normal');
    doc.setFontSize(7.5);
    const text = doc.splitTextToSize(value || '', width - 3);
    doc.text(text.slice(0, 1), x + 1.5, y + 4.8);
  }

  private drawConsultaPdfField(doc: jsPDF, label: string, value: string, x: number, y: number, width: number): void {
    doc.setFont('times', 'bold');
    doc.setFontSize(8.8);
    doc.text(label, x, y + 4.5);
    doc.rect(x + 26, y, width, 8);
    doc.setFont('times', 'normal');
    doc.setFontSize(8.8);
    doc.text(doc.splitTextToSize(value || '-', width - 4).slice(0, 1), x + 28, y + 5.3);
  }

  private wrapConsultaPdfCellText(doc: jsPDF, value: string, width: number): string {
    return doc.splitTextToSize((value || '').replace(/\s+/g, ' ').trim(), width).join('\n');
  }

  private drawMotivoOptions(doc: jsPDF, x: number, y: number): void {
    const motivos = [
      ['a. Prestamo', 'prestamo'],
      ['b. Reparacion y/o Mant.', 'reparacion'],
      ['c. Sin Uso - Excedente', 'sin uso'],
      ['d. Evento Oficial', 'evento'],
      ['e. Fin Academico', 'academico'],
      ['f. Otros', 'otro']
    ];
    const selected = (this.reporte?.motivo_traslado || '').toLowerCase();

    doc.setFont('times', 'normal');
    doc.setFontSize(7);

    motivos.forEach(([label, key], index) => {
      const row = index > 2 ? 1 : 0;
      const col = index % 3;
      const optionX = x + col * 50;
      const optionY = y + row * 9;

      doc.rect(optionX, optionY, 4, 4);
      if (selected.includes(key)) {
        doc.setFont('times', 'bold');
        doc.text('X', optionX + 1.1, optionY + 3.2);
        doc.setFont('times', 'normal');
      }
      doc.text(label, optionX + 6, optionY + 3.2);
    });
  }

  private drawSignaturesAtDocumentEnd(doc: jsPDF, tableFinalY: number): void {
    const blockHeight = 60;
    const blockWidth = this.pdfPageWidth - this.pdfMargin * 2;
    const bottomY = this.pdfPageHeight - this.pdfMargin - blockHeight;
    const minimumGap = 6;

    if (tableFinalY + minimumGap > bottomY) {
      doc.addPage('a4', 'portrait');
    }

    const y = bottomY;
    this.drawObservationAndSignatureBlock(doc, this.pdfMargin, y, blockWidth, blockHeight);
  }

  private drawObservationAndSignatureBlock(doc: jsPDF, x: number, y: number, width: number, height: number): void {
    const colWidth = width / 3;
    const observationHeight = 10;
    const confirmHeight = 15;
    const signatureHeight = 25;
    const nameHeight = height - observationHeight - confirmHeight - signatureHeight;
    const labels = [
      {
        title: 'Entrega Conforme:',
        subtitle: 'Firma y Sello del Jefe que Autoriza',
        name: this.reporte?.persona1 || '',
        cargo: this.reporte?.cargo1 || ''
      },
      {
        title: 'Recibe Conforme:',
        subtitle: 'Firma y Sello del Responsable de los Bienes',
        name: this.reporte?.persona2 || '',
        cargo: this.reporte?.cargo2 || ''
      },
      {
        title: 'V.B. Of. Control Patrimonial:',
        subtitle: 'Firma y Sello de la Jefatura',
        name: this.reporte?.persona3 || '',
        cargo: this.reporte?.cargo3 || ''
      }
    ];

    doc.setDrawColor(...this.pdfLineColor);
    doc.setLineWidth(0.3);
    doc.rect(x, y, width, height);
    doc.line(x, y + observationHeight, x + width, y + observationHeight);
    doc.line(x, y + observationHeight + confirmHeight, x + width, y + observationHeight + confirmHeight);
    doc.line(x, y + observationHeight + confirmHeight + signatureHeight, x + width, y + observationHeight + confirmHeight + signatureHeight);

    doc.setFont('times', 'bold');
    doc.setFontSize(7.5);
    doc.text('Observaciones:', x + 2, y + 6.5);

    labels.forEach((label, index) => {
      const colX = x + index * colWidth;
      if (index > 0) {
        doc.line(colX, y + observationHeight, colX, y + height);
      }

      doc.setFont('times', 'bold');
      doc.setFontSize(7.2);
      doc.text(label.title, colX + 2, y + observationHeight + 5);
      doc.setFont('times', 'normal');
      doc.text(label.subtitle, colX + 2, y + observationHeight + confirmHeight + signatureHeight - 3);

      doc.setFont('times', 'bold');
      doc.setFontSize(8);
      const name = doc.splitTextToSize(label.name || 'Nombres y Apellidos:', colWidth - 4);
      doc.text(name.slice(0, 1), colX + 2, y + observationHeight + confirmHeight + signatureHeight + 5);

      doc.setFont('times', 'normal');
      doc.setFontSize(7);
      const cargo = doc.splitTextToSize(label.cargo || 'Cargo:', colWidth - 4);
      doc.text(cargo.slice(0, 1), colX + 2, y + observationHeight + confirmHeight + signatureHeight + nameHeight - 2);
    });

    doc.setFont('times', 'normal');
    doc.setFontSize(6.5);
    doc.text('Usuario que entrega, usuario que recibe, OCONPAT', x + width - 2, y + height + 4, { align: 'right' });
  }

  private drawPageFrame(doc: jsPDF): void {
    doc.setDrawColor(...this.pdfLineColor);
    doc.setLineWidth(0.25);
    doc.rect(this.pdfMargin, 8, this.pdfPageWidth - this.pdfMargin * 2, this.pdfPageHeight - 16);
  }

  private addPageNumbers(doc: jsPDF): void {
    const totalPages = doc.getNumberOfPages();

    for (let page = 1; page <= totalPages; page++) {
      doc.setPage(page);
      doc.setFont('times', 'normal');
      doc.setFontSize(7);
      doc.text(`Pagina ${page} de ${totalPages}`, this.pdfPageWidth - this.pdfMargin, this.pdfPageHeight - 4, { align: 'right' });
    }
  }

  private formatDate(value?: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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
}
