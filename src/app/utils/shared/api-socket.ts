/*
Copyright (c) 2020-2024 CRS4

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

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
    if (!user) {
      this.logger.warn('User not defined');
      return;
    }
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
    if (user) {
      this.emit('message', {
        type: 'leave',
        data: { user: user.id },
      });
    }
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
