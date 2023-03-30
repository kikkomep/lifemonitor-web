import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { Subscription } from 'rxjs';
import {
  Workflow,
  WorkflowVersion,
  WorkflowVersionDescriptor
} from 'src/app/models/workflow.model';
import { Logger, LoggerManager } from 'src/app/utils/logging';
import { AppService } from 'src/app/utils/services/app.service';

declare var $: any;
@Component({
  selector: 'workflow-version-selector',
  templateUrl: './workflow-version-selector.component.html',
  styleUrls: ['./workflow-version-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowVersionSelectorComponent
  implements OnInit, OnChanges, OnDestroy, AfterViewChecked {
  private _workflow: Workflow;
  private _versions_map: { [name: string]: WorkflowVersionDescriptor };

  private _workflow_version: WorkflowVersionDescriptor;

  private _isLoadingSubcription: Subscription;

  versions: WorkflowVersionDescriptor[];

  @Output() workflow_version = new EventEmitter<WorkflowVersion>();
  @Output() loadingWorkflowVersion = new EventEmitter<Workflow>();

  // initialize logger
  private logger: Logger = LoggerManager.create(
    'WorkflowVersionSelectorComponent'
  );

  constructor(
    private appService: AppService,
    private cdRef: ChangeDetectorRef
  ) {
    this._isLoadingSubcription = this.appService.observableLoadingWorkflow.subscribe(
      (w) => {
        if (w.uuid === this.workflow.uuid) {
          this.refresh(w.loading);
        }
      }
    );
  }

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    this.logger.debug('Change detected');
    // this.cdRef.detectChanges();
    // this.jquerySelector.selectpicker();
  }

  ngOnDestroy(): void {
    if (this._isLoadingSubcription) this._isLoadingSubcription.unsubscribe();
  }

  ngAfterViewChecked(): void {
    this.jquerySelector.selectpicker();
  }

  get selectorId(): string {
    return `versionSelector-${this.workflow.uuid}`;
  }

  private get jquerySelector(): any {
    return $(`#${this.selectorId}`);
  }

  refresh(isLoading?: boolean) {
    const selector = this.jquerySelector;
    const loading = isLoading ?? this.isLoading();
    this.cdRef.detectChanges();
    if (loading) {
      selector.prop('disabled', true);
      selector.addClass('disabled');
    } else {
      selector.prop('disabled', false);
      selector.removeClass('disabled');
    }
    selector.selectpicker('refresh');
    this.cdRef.detectChanges();
  }

  @Input()
  set workflow(w: Workflow) {
    this.logger.debug('Setting workflow version: ', w);
    this._workflow = w;
    this._versions_map = {};
    this.versions = w.versionDescriptors;
    w.versionDescriptors.forEach(
      (v: WorkflowVersionDescriptor, index) => (this._versions_map[v.name] = v)
    );
    this.logger.debug('Version map:', this._versions_map);
    this.cdRef.detectChanges();
  }

  get workflow(): Workflow {
    return this._workflow;
  }

  public isLoading(): boolean {
    return this.appService.isLoadingWorkflow(this.workflow.uuid);
  }

  public selectVersion(version: string) {
    this.logger.debug('Selected workflow version:', version);
    this._workflow_version = this._versions_map[version];
    this.logger.debug('Selected workflow version:', this._workflow_version);
    this.loadingWorkflowVersion.next(this._workflow);
    this.appService
      .loadWorkflowVersion(this.workflow, version, true)
      .subscribe((v: WorkflowVersion) => {
        this.workflow.addVersion(v, true);
        this.loadingWorkflowVersion.next(null);
        this.workflow_version.emit(v);
        this.refresh();
      });
  }
}
