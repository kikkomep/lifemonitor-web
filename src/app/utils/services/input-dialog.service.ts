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
