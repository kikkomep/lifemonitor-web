import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkflowUploaderComponent } from './workflow-uploader.component';

describe('WorkflowUploaderComponent', () => {
  let component: WorkflowUploaderComponent;
  let fixture: ComponentFixture<WorkflowUploaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkflowUploaderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkflowUploaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
