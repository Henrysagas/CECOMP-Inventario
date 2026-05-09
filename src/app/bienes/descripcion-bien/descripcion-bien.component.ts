import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BienService } from '../../services/bien.service';
import { NzCardComponent } from "ng-zorro-antd/card";
import { NzDescriptionsModule } from "ng-zorro-antd/descriptions";
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableComponent } from 'ng-zorro-antd/table';
@Component({
  selector: 'app-descripcion-bien',
  standalone: true,
  imports: [CommonModule, NzCardComponent, NzDescriptionsModule,NzTableComponent,NzTableModule,NzGridModule,NzSelectModule],
  templateUrl: './descripcion-bien.component.html',
  styleUrls: ['./descripcion-bien.component.css']
})
export class DescripcionBienComponent implements OnInit {
  @Input() bienId!: number;

  bien: any;

  constructor(private bienService: BienService) {}

  ngOnInit(): void {
    if (this.bienId) {
      this.bienService.getBien(this.bienId).subscribe(data => {
        this.bien = data;
      });
    }
  }
}
