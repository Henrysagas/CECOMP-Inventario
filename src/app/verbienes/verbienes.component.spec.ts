import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerbienesComponent } from './verbienes.component';

describe('VerbienesComponent', () => {
  let component: VerbienesComponent;
  let fixture: ComponentFixture<VerbienesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerbienesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerbienesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
