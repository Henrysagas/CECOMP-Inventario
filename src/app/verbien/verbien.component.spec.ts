import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerBienComponent } from './verbien.component';

describe('VerbienComponent', () => {
  let component: VerBienComponent;
  let fixture: ComponentFixture<VerBienComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerBienComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerBienComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
