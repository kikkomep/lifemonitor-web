import { AppService } from 'src/app/utils/services/app.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AfterViewChecked, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import Stepper from 'bs-stepper';
import { UrlValue } from 'src/app/models/common.models';
import { InputDialogConfig } from 'src/app/utils/services/input-dialog.service';
import { WorkflowUploaderService } from 'src/app/utils/services/workflow-uploader.service';
import { v4 as uuidv4 } from 'uuid';

declare var $: any;

interface RegistrationError {
  code: number;
  title: string;
  message: string;
}

@Component({
  selector: 'app-workflow-uploader',
  templateUrl: './workflow-uploader.component.html',
  styleUrls: ['./workflow-uploader.component.scss'],
})
export class WorkflowUploaderComponent implements OnInit, AfterViewChecked {
  @Input() title = 'Register Workflow';
  @Input() iconClass = 'far fa-question-circle';
  @Input() iconClassSize = 'fa-7x';
  @Input() question = 'Are you sure?';
  @Input() description = 'Would you like to confirm?';
  @Input() confirmText = 'Register';
  @Input() cancelText = 'Cancel';
  @Input() onConfirm = null;

  private stepper: Stepper;
  private _processing: boolean = false;
  private _registrationError: RegistrationError = null;

  name: string = 'uploaderDialog';
  roCrateFile: object;
  roCrateURL: UrlValue;

  _workflowUUID: string = null;
  _workflowName: string = null;
  _workflowVersion: string = null;
  _authorizationHeader: string = null;

  errors: [] = [];

  source: string = 'remoteRoCrate';

  constructor(
    private httpClient: HttpClient,
    private appService: AppService,
    private service: WorkflowUploaderService,
    private cdref: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    $('#' + this.name).on('hide.bs.modal', () => {
      console.log('hidden');
    });

    $('#' + this.name).on('show.bs.modal', () => {
      let config: InputDialogConfig = this.service.getConfig();
      this.title = config.title || this.title;
      this.iconClass = config.iconClass || this.iconClass;
      this.iconClassSize = config.iconClassSize || this.iconClassSize;
      this.question = config.question || this.question;
      this.description = config.description || this.description;
      this.confirmText = config.confirmText || this.confirmText;
      this.cancelText = config.cancelText || this.cancelText;
      this.onConfirm = config.onConfirm || null;
      // initialise stepper
      if (!this.stepper) {
        this.stepper = new Stepper(document.querySelector('#uploaderStepper'), {
          linear: false,
          animation: true,
        });
      }
      // reset all input
      this._reset();

      ///////////////////////////////////////////////////////////////////////////////////////////////////////////
      console.log('shown');
    });
  }

  ngAfterViewChecked() {
    this.cdref.detectChanges();
  }

  public get workflowUUID(): string {
    return this._workflowUUID;
  }

  public set workflowUUID(value: string) {
    this._workflowUUID = value;
    let valid = this.checkIfValidUUID(value);
    console.log('Setting workflow UUID: ' + value + ' (valid: ' + valid + ')');
    this._setError('uuid', valid ? null : "Not valid UUID");
  }

  public get workflowName(): string {
    return this._workflowName;
  }

  public set workflowName(name: string) {
    this._workflowName = name;
    console.log('Setting workflow name: ', this._workflowName);
  }

  public get workflowVersion(): string {
    return this._workflowVersion;
  }

  public set workflowVersion(value: string) {
    this._workflowVersion = value;
    let valid = this.checkIfValidVersion(value);
    console.log('Setting workflow version: ' + value + ' (valid: ' + valid + ')');
    this._setError('version', valid ? null : "Not valid version");
  }

  public get authorizationHeader(): string {
    return this._authorizationHeader;
  }

  public set authorizationHeader(value: string) {
    this._authorizationHeader = value;
    console.log("Setting auth header: " + this.authorizationHeader);
  }

  public show() {
    $('#' + this.name).modal('show');
  }

  public hide() {
    $('#' + this.name).modal('hide');
  }

  public setSource(value: string) {
    this.source = value;
    console.log('Selected Source: ', this.source);
    this.validateWorkflowSource();
    // this.stepper.next();
    console.log('Current step', this.currentStepIndex);
  }

  public setRoCrateFile() {
    console.log(document.getElementById('roCrateInputFile')['files']);
    let input = document.getElementById('roCrateInputFile');
    this.roCrateFile = input;
    console.log(this.roCrateFile);
    var fReader = new FileReader();
    fReader.readAsDataURL(input['files'][0]);
    fReader.onloadend = function (event) {
      var img: object = document.getElementById('filePreview');
      img['innerHTML'] = event.target.result;
    };
  }

  public updateRoCrateUrl(event: any) {
    let input = document.getElementById('roCrateUrl');
    console.log(input);
    this.roCrateURL.url = input['value'];
    if (!this.roCrateURL.isValid) {
      input.classList.add('is-invalid');
    } else {
      input.classList.remove('is-invalid');
    }
    this.validateWorkflowSource();
  }

  public get currentStepIndex(): number {
    return !this.stepper ? -1 : this.stepper['_currentIndex'];
  }

  public previous() {
    this.stepper.previous();
  }

  public next() {
    this.stepper.next();
  }

  public processing(): boolean {
    return this._processing;
  }

  public confirm() {
    try {
      console.log('Workflow source: ', this.source);
      if (this.source === 'remoteRoCrate') {
        this._processing = true;
        this.appService
          .registerWorkflowByUrl(
            this.roCrateURL.url,
            this.workflowUUID,
            this.workflowVersion,
            this.workflowName,
            false,
            this.authorizationHeader
          )
          .subscribe(
            (data) => {
              console.log('Workflow registered (from uploader)', data);
              this.hide();
              this._processing = false;
            },
            (err) => {
              console.log('Error', err);
              this._handleError(err);
              this._processing = false;
            }
          );
      }
      if (this.onConfirm) {
        this.onConfirm();
      }
    } catch (ex) {
      console.error(ex);
    } finally {
      // this.hide();
    }
  }

  public validateWorkflowSource(): boolean {
    if (
      ((this.source === 'localRoCrate' && this.roCrateFile) ||
        (this.source === 'remoteRoCrate' &&
          this.roCrateURL &&
          this.roCrateURL.isValid))
    ) {
      return true;
    } else {
      return false;
    }
  }

  public validateWorkflowDetails(): boolean {
    if (
      this.errors.length == 0 &&
      this.workflowUUID &&
      this.workflowVersion &&
      ((this.source === 'localRoCrate' && this.roCrateFile) ||
        (this.source === 'remoteRoCrate' &&
          this.roCrateURL &&
          this.roCrateURL.isValid))
    ) {
      return true;
    } else {
      return false;
    }
  }

  public get registrationError(): RegistrationError {
    return this._registrationError;
  }

  private _setError(name: string, value: string = null) {
    if (value === null) {
      $('#' + name).removeAttr('disabled');
      this.errors[name] = null;
    } else {
      $('#' + name).attr('disabled', true);
      this.errors[name] = value;
    }
  }

  /* Check if string is valid UUID */
  public checkIfValidUUID(uuid: string) {
    const regexExp = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;
    return regexExp.test(uuid);
  }

  public checkIfValidVersion(version: string) {
    const versionExp = /^\d+(\.\d+){0,2}$/;
    return versionExp.test(version);
  }

  public _reset() {
    this.errors = [];
    this.workflowName = null;
    this.workflowUUID = uuidv4();
    this.workflowVersion = '1.0';
    this.roCrateURL = new UrlValue(this.httpClient);
  }

  private _handleError(err: HttpErrorResponse) {
    console.log('Processing error', err);
    this._registrationError = {
      code: err.status,
      title: err.error.title,
      message: err.error.detail,
    } as RegistrationError;
  }
}
