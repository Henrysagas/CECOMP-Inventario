import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialResponsablesComponent } from './historial-responsables.component';

describe('HistorialResponsablesComponent', () => {
  let component: HistorialResponsablesComponent;
  let fixture: ComponentFixture<HistorialResponsablesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialResponsablesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistorialResponsablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
