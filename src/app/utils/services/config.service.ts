import { Injectable } from '@angular/core';
import { AppConfigLoader } from './config.loader';

@Injectable({
  providedIn: 'root',
})
export class AppConfigService extends AppConfigLoader {
  public privacyPolicyUrl: string =
    'https://lifemonitor.eu/legal/privacy-policy.pdf';
  public termsOfServiceUrl: string =
    'https://lifemonitor.eu/legal/terms-and-conditions.pdf';
}
