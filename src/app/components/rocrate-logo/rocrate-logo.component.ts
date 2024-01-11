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
import { WorkflowVersion } from 'src/app/models/workflow.model';
import { Logger, LoggerManager } from 'src/app/utils/logging';
import { AppService } from 'src/app/utils/services/app.service';
import { AppConfigService } from 'src/app/utils/services/config.service';

declare var $: any;

@Component({
  selector: 'rocrate-logo',
  templateUrl: './rocrate-logo.component.html',
  styleUrls: ['./rocrate-logo.component.scss'],
})
export class RocrateLogoComponent implements OnInit {
  @Input() workflow: WorkflowVersion;

  private _availableForDownload: boolean;

  // initialize logger
  private logger: Logger = LoggerManager.create('RocrateLogoComponent');

  constructor(
    private appConfig: AppConfigService,
    private appService: AppService
  ) {}

  ngOnInit(): void {
    this._availableForDownload = null;
    this.appService
      .checkROCrateAvailability(this.workflow)
      .subscribe((active: boolean) => {
        this._availableForDownload = active;
      });
  }

  public get roCrateDownloadUrl(): string {
    return this.workflow.getDownloadLink(this.appConfig.apiBaseUrl);
  }

  public get availableForDownload(): boolean {
    return this._availableForDownload;
  }

  public downloadROCrate() {
    if (this.workflow) {
      this.logger.debug('Downloading RO-Crate of workflow ', this.workflow);
      this.appService.downloadROCrate(this.workflow);
    }
    return false;
  }
}
