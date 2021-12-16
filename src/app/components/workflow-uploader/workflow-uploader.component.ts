import { AppService } from 'src/app/utils/services/app.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import Stepper from 'bs-stepper';
import { UrlValue } from 'src/app/models/common.models';
import { InputDialogConfig } from 'src/app/utils/services/input-dialog.service';
import { WorkflowUploaderService } from 'src/app/utils/services/workflow-uploader.service';
import { v4 as uuidv4 } from 'uuid';
import { Registry, RegistryWorkflow } from 'src/app/models/registry.models';
import { Subscription } from 'rxjs';

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
export class WorkflowUploaderComponent
  implements OnInit, AfterViewChecked, AfterViewInit {
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
  _workflowROCrate: string = null;

  _registries: Registry[];

  private _registryWorkflows: RegistryWorkflow[] = [];
  private _selectedRegistry: Registry = null;
  private _selectedRegistryWorkflow: RegistryWorkflow = null;

  // subscriptions
  private _subscriptions: Subscription[] = [];

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

    let s = $('#' + this.name).on('show.bs.modal', () => {
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
    });

    this._subscriptions.push(
      this.appService.observableRegistries.subscribe((data: Registry[]) => {
        this.updateRegistries(data);
        console.log('Loaded registries: ', this.registries);
      })
    );

    this._subscriptions.push(
      this.appService.observableRegistry.subscribe((registry: Registry) => {
        this._selectedRegistry = registry;
        console.log('Loaded registry', this.selectedRegistry);
      })
    );

    this._subscriptions.push(
      this.appService.observableRegistryWorkflow.subscribe((w: RegistryWorkflow) => {
        this._selectedRegistryWorkflow = w;
        console.log('Loaded registry workflow', w);
        // Set defauls
        this._workflowName = w.name;
        this._workflowVersion = w.latest_version;
      })
    );

    this._subscriptions.push(
      this.appService.observableRegistryWorkflows.subscribe(
        (workflows: RegistryWorkflow[]) => {
          this.updateRegistryWorkflows(workflows);
        }
      )
    );

    let modal = $('#' + this.name);
    modal.on('shown.bs.modal', () => {
      console.log('shown');
      this.appService.loadRegistries().subscribe((registries: Registry[]) => {
        console.log("data registries....", registries);
      });
    });
  }

  ngAfterViewInit(): void { }

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
    this._setError('uuid', valid ? null : 'Not valid UUID');
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
    console.log(
      'Setting workflow version: ' + value + ' (valid: ' + valid + ')'
    );
    this._setError('version', valid ? null : 'Not valid version');
  }

  public get authorizationHeader(): string {
    return this._authorizationHeader;
  }

  public set authorizationHeader(value: string) {
    this._authorizationHeader = value;
  }

  public get workflowROCrate(): string {
    return this._workflowROCrate;
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
    if (this.source === 'registry') {
      this.cdref.detectChanges();
      this.updateRegistries(this.registries);
      $('#registrySelector').selectpicker();
      $('#registryWorkflowSelector').prop('disabled', true);
      $('#registryWorkflowSelector').selectpicker();
      $('#registryWorkflowSelector').selectpicker('refresh');
    }
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
    fReader.onloadend = (event) => {
      let data: string = event.target.result as string;
      this._workflowROCrate = data.split(',')[1];
      console.log('Loaded RO-Crate', this._workflowROCrate);
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

  public get registries(): Registry[] {
    return this._registries;
  }

  public get registryWorkflows(): RegistryWorkflow[] {
    return this._registryWorkflows;
  }

  public get selectedRegistry(): Registry {
    return this._selectedRegistry;
  }

  public get selectedRegistryWorkflow(): RegistryWorkflow {
    return this._selectedRegistryWorkflow;
  }

  public patchRegistryName(name: string): string {
    // TODO: remove this when the back-end will support
    // the name/title attribute for registries
    if (name === 'wfhubdev') return "WorkflowHub (dev)";
    if (name === 'wfhub') return "WorkflowHub";
    return name;
  }

  private updateRegistries(registries: Registry[]) {
    this._registries = registries;
    $('#registrySelector').append('<option value=\'\'></option>')
    $('#registrySelector')
      .find('option')
      .remove()
      .end()
      .append('<option value=\'\'></option>')
      .val('');
    if (registries) {
      for (let r of registries) {
        $('#registrySelector').append('<option value="' + r.uuid + '" '
          + 'data-content="'
          + '<span class=\'larger\'>' + this.patchRegistryName(r.name) + '</span>'
          + '<span class=\'ml-1 text-muted small\'><a href=\'' + r.uri + '\'>' + r.uri + '</a></span>'
          + '<div class=\'mr-4 text-muted\'>'
          + '<span class=\'badge badge-primary mr-1\'>LifeMonitor ID</span>'
          + '<span class=\'small\'>' + r.uuid + '</span>'
          + '</div>">'
          + '</option>');
      }
    }
    this.cdref.detectChanges();
    $('#registryWorkflowSelector').selectpicker('refresh');
  }


  public selectRegistry(value: any) {
    console.log('Selecting registry....', value);
    this.updateRegistryWorkflows([]);
    if (value && value.length > 0) {
      this.appService.selectRegistry(value);
    }
  }

  public selectRegistryWorkflow(workflow_identifier: string) {
    console.log("Selecting RegistryWorkflow", workflow_identifier);
    if (workflow_identifier && workflow_identifier.length > 0) {
      this.appService.selectRegistryWorkflow(workflow_identifier);
    } else {
      this._selectedRegistryWorkflow = null;
    }
  }

  private updateRegistryWorkflows(data: RegistryWorkflow[]) {
    this._registryWorkflows = data;
    this._selectedRegistryWorkflow = null;
    // clean up options
    $('#registryWorkflowSelector')
      .find('option')
      .remove()
      .end()
      .append('<option value=\'\'></option>')
      .val('');
    // append new options
    if (!this.registryWorkflows || this.registryWorkflows.length === 0) {
      $('#registryWorkflowSelector').prop('disabled', true);
    } else {
      for (let w of this.registryWorkflows) {
        $('#registryWorkflowSelector').append(
          '<option value="' + w.identifier
          + '" data-content="'
          + w.name
          + '<div>'
          + '<span class=\'badge badge-primary mr-1\'>'
          + w.registry.type + ' ID' + '</span>'
          + '<span class=\'small text-muted\'><a href=\'' + w.links['origin'] + '\'>'
          + w.links['origin'] + '</a></span>'
          + '</div>'
          + '"></option>'
        );
      }
      $('#registryWorkflowSelector').prop('disabled', false);
    }
    // force view refresh
    this.cdref.detectChanges();
    $('#registryWorkflowSelector').selectpicker('refresh');
  }


  public confirm() {
    try {
      console.log('Workflow source: ', this.source);
      let request = null;
      if (this.source === 'remoteRoCrate') {
        request = this.appService.registerWorkflowRoCrate(
          this.workflowUUID,
          this.workflowVersion,
          this.roCrateURL.url,
          null,
          this.workflowName,
          false,
          this.authorizationHeader
        );
      } else if (this.source === 'localRoCrate') {
        request = this.appService.registerWorkflowRoCrate(
          this.workflowUUID,
          this.workflowVersion,
          null,
          this.workflowROCrate,
          this.workflowName,
          false,
          this.authorizationHeader
        );
      } else if (this.source === 'registry') {
        request = this.appService.registerRegistryWorkflow(
          this.selectedRegistryWorkflow,
          this.workflowVersion,
          this.workflowName,
          false
        );
      }

      if (request) {
        this._processing = true;
        request.subscribe(
          (data: any) => {
            console.log('Workflow registered (from uploader)', data);
            this.hide();
            this._processing = false;
          },
          (err: HttpErrorResponse) => {
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
    if (this.source === 'localRoCrate' && this._workflowROCrate) return true;
    else if (
      this.source === 'remoteRoCrate' &&
      this.roCrateURL &&
      this.roCrateURL.isValid
    )
      return true;
    else if (
      this.source === 'registry' &&
      this.selectedRegistry &&
      this.selectedRegistryWorkflow
    )
      return true;
    else
      return false;
  }

  public validateWorkflowDetails(): boolean {
    if (this.errors.length != 0 || !this.workflowVersion) return false;
    if (this.source === 'localRoCrate' && !this.roCrateFile) return false;
    if (this.source === 'remoteRoCrate'
      && (!this.roCrateURL || !this.roCrateURL.isValid)) return false;
    if (!this.workflowUUID
      && (this.source === 'localRoCrate' || this.source === 'remoteRoCrate')) {
      return false;
    }
    if (this.source === 'registry'
      && (this.selectedRegistry === null || this.selectedRegistryWorkflow === null))
      return false;
    return true;
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
    this.stepper.reset();
    this.errors = [];
    this.source = 'localRoCrate';
    this.workflowName = null;
    this.workflowUUID = uuidv4();
    this.workflowVersion = '1.0';
    this.roCrateFile = null;
    this._workflowROCrate = null;
    this.roCrateURL = new UrlValue(this.httpClient);
    this._registrationError = null;
    $("#radioPrimary1").prop("checked", true);
    $("#radioPrimary2").prop("checked", false);
    $("#radioPrimary3").prop("checked", false);
    // reset file selector
    let input = document.getElementById('roCrateUrl');
    if (input) {
      input['value'] = null;
    }
  }

  // FIXME: remote this line... just for testing
  // this.roCrateURL.url =
  //   'https://www.dropbox.com/s/2p9dpf6s5sio877/ro-crate-galaxy-sortchangecase.crate.zip?dl=1';

  private _handleError(err: HttpErrorResponse) {
    console.log('Processing error', err);
    this._registrationError = {
      code: err.status,
      title: err.error.title,
      message: err.error.detail,
    } as RegistrationError;
  }

  public ngOnDestroy() {
    for (let s of this._subscriptions) {
      s.unsubscribe();
    }
  }
}
