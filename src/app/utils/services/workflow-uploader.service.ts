import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Logger, LoggerManager } from '../logging';
declare var $: any;

export interface Config {
  title?: string;
  iconClass?: string;
  iconClassSize?: string;
  question?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: any;
}

@Injectable({
  providedIn: 'root',
})
export class WorkflowUploaderService {
  private inputDialog = 'uploaderDialog';

  public title = null;
  public iconClass = 'far fa-question-circle';
  public iconClassSize = 'fa-7x';
  public question = 'Are you sure?';
  public description = 'Would you like to confirm?';
  public confirmText = 'Confirm';
  public cancelText = 'Cancel';

  private _config: Config;

  // initialize logger
  private logger: Logger = LoggerManager.create('WorkflowUploaderService');

  constructor(
    private httpClient: HttpClient) {}

  public show(options: Config) {
    this._config = options;
    $('#' + this.inputDialog).modal('show');
  }

  public hide() {
    $('#' + this.inputDialog).modal('hide');
  }

  public getConfig(): Config {
    return this._config;
  }

  public exists(url: string): boolean {
    if (!url) return false;
    this.httpClient.head(url).subscribe(
      (data) => {
        this.logger.log('Data', data);
        return true;
      },
      (err) => {
        this.logger.log('Error', err);
        return false;
      }
    );
  }
}
