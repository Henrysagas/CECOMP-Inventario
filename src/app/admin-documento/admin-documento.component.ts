import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { DocumentoConfig, DocumentoConfigService } from '../services/documento-config.service';

@Component({
  selector: 'app-admin-documento',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NzButtonModule, NzInputModule],
  templateUrl: './admin-documento.component.html',
  styleUrls: ['./admin-documento.component.css']
})
export class AdminDocumentoComponent implements OnInit {
  config!: DocumentoConfig;

  constructor(private documentoConfigService: DocumentoConfigService) {}

  ngOnInit(): void {
    this.config = this.documentoConfigService.getConfig();
  }
}
