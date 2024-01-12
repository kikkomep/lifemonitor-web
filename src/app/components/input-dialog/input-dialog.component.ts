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

import { Component, Input, OnInit } from '@angular/core';
import { Logger, LoggerManager } from 'src/app/utils/logging';
import {
  InputDialogConfig,
  InputDialogService,
} from 'src/app/utils/services/input-dialog.service';

declare var $: any;

@Component({
  selector: 'app-input-dialog',
  templateUrl: './input-dialog.component.html',
  styleUrls: ['./input-dialog.component.scss'],
})
export class InputDialogComponent implements OnInit {
  @Input() title = null;
  @Input() iconClass = 'far fa-question-circle';
  @Input() iconClassSize = 'fa-7x';
  @Input() iconImage = null;
  @Input() iconImageSize = '100px';
  @Input() question = 'Are you sure?';
  @Input() description = 'Would you like to confirm?';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() onConfirm = null;
  @Input() enableCancel = true;
  @Input() onCancel = null;
  @Input() enableClose = true;

  name: string = 'inputModalDialog';

  // initialize logger
  private logger: Logger = LoggerManager.create('InputDialogComponent');

  constructor(private service: InputDialogService) {}

  ngOnInit(): void {
    $('#' + this.name).on('hide.bs.modal', () => {
      this.logger.debug('hidden');
    });

    $('#' + this.name).on('show.bs.modal', () => {
      let config: InputDialogConfig = this.service.getConfig();
      this.title = config.title || this.title;
      this.iconClass = config.iconClass || this.iconClass;
      this.iconClassSize = config.iconClassSize || this.iconClassSize;
      this.iconImage = config.iconImage || this.iconImage;
      this.iconImageSize = config.iconImageSize || this.iconImageSize;
      this.question = config.question || this.question;
      this.description = config.description || this.description;
      this.confirmText = config.confirmText || this.confirmText;
      this.cancelText = config.cancelText || this.cancelText;
      this.onConfirm = config.onConfirm || null;
      this.enableCancel = config.enableCancel ?? true;
      this.onCancel = config.onCancel || null;
      this.enableClose = config.enableClose ?? true;
      this.logger.debug('shown');
    });
  }

  public show() {
    $('#' + this.name).modal('show');
  }

  public hide() {
    $('#' + this.name).modal('hide');
  }

  confirm() {
    try {
      if (this.onConfirm) {
        this.onConfirm();
      }
    } finally {
      this.hide();
    }
  }
  cancel() {
    try {
      if (this.onCancel) this.onCancel();
    } finally {
      this.hide();
    }
  }
}
