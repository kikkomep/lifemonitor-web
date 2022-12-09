import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment.test';

import { LifeMonitorApiService } from './lifemonitor-api.service';

const baseApiUrl: string = environment.apiBaseUrl;

describe('LifemonitorService', () => {
  let service: LifeMonitorApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
    });
    service = TestBed.inject(LifeMonitorApiService);
    service.initialize(environment.apiBaseUrl, environment.apiKey);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return a list of workflows', (done: DoneFn) => {
    service.getPublicWorkflows().subscribe((value) => {
      console.log('The value: ', value);
      expect(value).toBeDefined();
      done();
    });
  });

  it('should return a list of workflows', (done: DoneFn) => {
    service.getPublicWorkflows().subscribe((value) => {
      console.log('The value: ', value);
      expect(value).toBeDefined();
      done();
    });
  });
});
