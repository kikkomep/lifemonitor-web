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
