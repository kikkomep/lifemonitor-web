import { Injectable } from '@angular/core';
declare var $: any;

export interface InputDialogConfig {
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
