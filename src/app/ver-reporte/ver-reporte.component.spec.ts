import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerReporteComponent } from './ver-reporte.component';

describe('VerReporteComponent', () => {
  let component: VerReporteComponent;
  let fixture: ComponentFixture<VerReporteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerReporteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerReporteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
