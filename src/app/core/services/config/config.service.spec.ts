import {
  HttpClient,
  HttpClientModule,
  HttpErrorResponse,
} from '@angular/common/http';
import { isDevMode } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Config } from '../../models/config.model';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [ConfigService],
    });
    service = TestBed.inject(ConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have an empty initial configuration', () => {
    expect(service.getConfig()).toBeDefined();
  });

  it('should use the configFile property in DevMode', () => {
    if (isDevMode()) expect(service.getConfig()['configFile']).toBeDefined();
  });

  it('should raise an error if the configuration asset is not available', (done: DoneFn) => {
    // set config file to not existing file
    let spy = spyOn(service, 'getConfig').and.returnValue({
      configFile: '/notExistingFilename',
    });

    service.loadConfig().subscribe({
      next: () => done.fail('Expected error'),
      error: (error: any) => {
        expect(service.getConfig).toHaveBeenCalled();
        expect(error.message).toContain(
          'Unable to load the configuration file'
        );
        done();
      },
    });
  });

  it('should load a valid configuration object', (done: DoneFn) => {
    service.loadConfig().subscribe({
      next: (data) => {
        let expectedProperties: string[] = [
          'production',
          'apiBaseUrl',
          'clientId',
          'configFile',
        ];
        let actualProperties: string[] = Object.keys(data);
        expectedProperties.forEach((key) => {
          expect(actualProperties).toContain(key);
        });
        expect;
        done();
      },
    });
  });
});
