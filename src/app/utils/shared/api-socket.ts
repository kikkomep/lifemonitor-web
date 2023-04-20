import { Socket } from 'ngx-socket-io';
import { Logger, LoggerManager } from '../logging';
import { AppConfigService } from '../services/config.service';
import { User } from 'src/app/models/user.modes';

// max age (in msecs) of received messages
export const MAX_AGE = 10 * 1000;

export class ApiSocket extends Socket {
  private logger: Logger = LoggerManager.create('ApiSocketService');
  private messageHandler: any = null;
  private worker: Worker;

  constructor(
    private configService: AppConfigService,
    messageHandler: any,
    worker: Worker
  ) {
    super({
      url: configService.socketBaseUrl,
      options: {
        // transports: ['websocket'],
      },
    });

    // register worker
    this.worker = worker;

    // register messageHandler
    this.messageHandler = messageHandler;

    // Register 'connect' event listener
    this.on('connect', () => this.onConnect());
    // Register 'disconnect' event listener
    this.on('disconnect', () => this.onDisconnect());

    // Register 'message' event listener
    this.fromEvent('message').subscribe((data: any) => {
      const mDate = new Date(data['timestamp'] * 1000);
      const rDate = new Date().getTime();
      const mAge = rDate - mDate.getTime();
      this.logger.info(
        `Received message @ ${new Date(
          rDate
        ).toUTCString()} (published at ${mDate} - age: ${mAge} msecs)`,
        data
      );
      if (!('payload' in data)) {
        this.logger.warn('incompatible message', data);
        return;
      }
      this.logger.debug('Received ' + data['payload']['type']);
      if (!mAge || mAge <= MAX_AGE) {
        if (data && data['payload'] && data['payload']['type']) {
          const methodName =
            'on' + this.capitalizeFirstLetter(data['payload']['type']);
          if (this[methodName]) {
            this.logger.debug(`Handling method ${methodName} locally`);
            this[methodName](data['payload']);
          }
          if (this.messageHandler[methodName]) {
            this.logger.debug(
              `Handling method ${methodName} through messageHandler`
            );
            this.messageHandler[methodName](data['payload']);
          } else {
            this.logger.debug('Posting message top worker', data);
            if (!this.worker) {
              this.logger.warn('Worker not defined');
            } else {
              this.worker.postMessage(data['payload']);
            }
          }
        }
      } else {
        this.logger.warn(`Message skipped: too old (age ${mAge} msecs)`);
      }
    });
    //
    this.logger.debug('Socket service initialized!');
  }

  public setWorker(worker: Worker) {
    this.worker = worker;
  }

  public join(user: User) {
    this.emit('message', {
      type: 'join',
      data: { user: user.id },
    });
  }

  public sync() {
    this.emit('message', {
      type: 'sync',
    });
  }

  public onJoined(payload: { data: { user: string } }) {
    this.logger.debug(`user ${payload.data.user} joined`);
  }

  public leave(user: User) {
    this.emit('message', {
      type: 'leave',
      data: { user: user.id },
    });
  }

  public onLeft(payload: { data: { user: string } }) {
    this.logger.debug(`user ${payload.data.user} left`);
  }

  onConnect() {
    this.logger.info('WS connection established');
  }

  onDisconnect() {
    this.logger.info('WS connection interrupted');
  }

  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
