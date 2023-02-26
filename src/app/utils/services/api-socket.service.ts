import { Injectable, NgModule } from '@angular/core';
import { Socket, SocketIoConfig } from 'ngx-socket-io';
import { AppConfigService } from './config.service';

@Injectable()
export class ApiSocketService extends Socket {
  constructor(private configService: AppConfigService) {
    super({ url: '/', options: {} });
  }
}
