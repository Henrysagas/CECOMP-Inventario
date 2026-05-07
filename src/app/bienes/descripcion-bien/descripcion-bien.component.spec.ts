import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DescripcionBienComponent } from './descripcion-bien.component';

describe('DescripcionBienComponent', () => {
  let component: DescripcionBienComponent;
  let fixture: ComponentFixture<DescripcionBienComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DescripcionBienComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DescripcionBienComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
