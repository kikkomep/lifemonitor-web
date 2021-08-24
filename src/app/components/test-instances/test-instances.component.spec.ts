import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestInstancesComponent } from './test-instances.component';

describe('TestInstancesComponent', () => {
  let component: TestInstancesComponent;
  let fixture: ComponentFixture<TestInstancesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TestInstancesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestInstancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
