import { Injectable } from '@angular/core';
import { AppConfigLoader } from './config.loader';

@Injectable({
  providedIn: 'root',
})
export class AppConfigService extends AppConfigLoader {
}
