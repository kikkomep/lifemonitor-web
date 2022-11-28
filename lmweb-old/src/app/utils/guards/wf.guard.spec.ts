import { TestBed } from '@angular/core/testing';

import { WfGuard } from './wf.guard';

describe('WfGuard', () => {
  let guard: WfGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(WfGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
