import { TestBed } from '@angular/core/testing';

import { WorkflowUploaderService } from './workflow-uploader.service';

describe('WorkflowUploaderService', () => {
  let service: WorkflowUploaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkflowUploaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
