import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatsBarChartComponent } from './stats-bar-chart.component';

describe('StatsBarChartComponent', () => {
  let component: StatsBarChartComponent;
  let fixture: ComponentFixture<StatsBarChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StatsBarChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StatsBarChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
