// Http testing module and mocking controller
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

// Other imports
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ConfigService } from '../../services/config/config.service';
import { apiNotConfiguredErrorMessage, BaseService } from './base-service';

// Import testing environment
import { environment } from '../../../environments/environment.test';

describe('BaseService', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let baseService: BaseService;
  let configService: ConfigService;

  const baseApiUrl = environment.apiBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BaseService],
    });

    // Inject the http service and test controller for each test
    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    // Get reference to the baseService instance
    baseService = TestBed.inject(BaseService);
    // Get a reference to a ConfigService
    configService = TestBed.inject(ConfigService);
  });

  it('should be created', () => {
    expect(baseService).toBeTruthy();
  });

  it('should raise and error if baseApiUrl is not configured', () => {
    expect(() => {
      baseService.baseApiUrl;
    }).toThrowError(apiNotConfiguredErrorMessage);
  });

  it('should not have an API Key set', () => {
    expect(baseService.apiKey).toBeFalsy();
  });

  it('should set and return an API Key', () => {
    const apiKey = '1234567';
    baseService.initialize(baseApiUrl, apiKey);
    expect(baseService.apiKey).toBeTruthy();
    expect(baseService.apiKey).toEqual(apiKey);
  });

  it('should set and return the baseApiUrl', () => {
    baseService.initialize(baseApiUrl);
    expect(baseService.baseApiUrl).toEqual(baseApiUrl);
  });
});
