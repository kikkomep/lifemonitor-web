import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkflowVersionSelectorComponent } from './workflow-version-selector.component';

describe('WorkflowVersionSelectorComponent', () => {
  let component: WorkflowVersionSelectorComponent;
  let fixture: ComponentFixture<WorkflowVersionSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkflowVersionSelectorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkflowVersionSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
