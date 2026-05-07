import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NuevoBienComponent } from './nuevo-bien.component';

describe('NuevoBienComponent', () => {
  let component: NuevoBienComponent;
  let fixture: ComponentFixture<NuevoBienComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuevoBienComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NuevoBienComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
