import { Injectable } from '@angular/core';
import { Logger, LoggerManager } from '../logging';
declare var $: any;

export interface InputDialogConfig {
  title?: string;
  iconClass?: string;
  iconClassSize?: string;
  iconImage?: string;
  iconImageSize?: string;
  question?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: any;
  enableCancel?: boolean;
  onCancel?: any;
  enableClose?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class InputDialogService {
  private inputDialog = 'inputModalDialog';

  public title = null;
  public iconClass = 'far fa-question-circle';
  public iconClassSize = 'fa-7x';
  public question = 'Are you sure?';
  public description = 'Would you like to confirm?';
  public confirmText = 'Confirm';
  public cancelText = 'Cancel';

  private _config: InputDialogConfig;

  // initialize logger
  private logger: Logger = LoggerManager.create('InputDialogService');

  constructor() {}

  public show(options: InputDialogConfig) {
    this._config = options;
    $('#' + this.inputDialog).modal('show');
  }

  public hide() {
    $('#' + this.inputDialog).modal('hide');
  }

  public getConfig(): InputDialogConfig {
    return this._config;
  }
}
