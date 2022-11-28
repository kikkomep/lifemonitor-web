import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RocrateLogoComponent } from './rocrate-logo.component';

describe('RocrateLogoComponent', () => {
  let component: RocrateLogoComponent;
  let fixture: ComponentFixture<RocrateLogoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RocrateLogoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RocrateLogoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
