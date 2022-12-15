import { TestBed } from '@angular/core/testing';
import { Workflow } from './workflow.model';

const workflowData: Workflow = {
  latest_version: '1',
  name: 'basefreqsum',
  public: true,
  uuid: '75a27d31-ccfe-4177-a280-156424cb124c',
};

describe('Workflow model', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [],
      declarations: [],
    }).compileComponents();
  });

  it('should create the workflow model', () => {
    expect(workflowData).toBeTruthy();
  });
});
