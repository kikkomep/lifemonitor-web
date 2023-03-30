import { Socket } from 'ngx-socket-io';
import { Logger, LoggerManager } from '../logging';
import { AppConfigService } from '../services/config.service';

export class ApiSocket extends Socket {
  private logger: Logger = LoggerManager.create('ApiSocketService');

  constructor(private configService: AppConfigService) {
    super({
      url: configService.socketBaseUrl,
      options: {
        // transports: ['websocket'],
      },
    });
    this.logger.debug('Socket service created!');
  }
}
