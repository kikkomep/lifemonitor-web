import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { LifemonitorApiService } from './lifemonitor-api.service';

describe('LifemonitorService', () => {
  let service: LifemonitorApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
    });
    service = TestBed.inject(LifemonitorApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return a list of workflows', (done: DoneFn) => {
    service.getWorkflows().subscribe((value) => {
      console.log('The value: ', value);
      expect(value).toBeDefined();
      done();
    });
  });
});
