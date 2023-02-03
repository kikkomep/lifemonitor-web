import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Logger, LoggerManager } from '../logging';
import { AppConfigLoader } from './config.loader';

@Injectable({
  providedIn: 'root',
})
export class AppConfigService extends AppConfigLoader {
  // initialize logger
  // private logger: Logger = LoggerManager.create('AppConfigService');
}
