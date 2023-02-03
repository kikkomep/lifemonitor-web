import { Injectable } from '@angular/core';
import { AuthHandler } from './auth';
import { AppConfigService } from './config.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService extends AuthHandler {
  constructor(config: AppConfigService) {
    super(config);
  }
}
