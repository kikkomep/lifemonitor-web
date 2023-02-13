import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  Workflow,
  WorkflowVersion,
  WorkflowVersionDescriptor,
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
export class WorkflowVersionSelectorComponent implements OnInit, OnChanges {
  private _workflow: Workflow;
  private _versions_map: { [name: string]: WorkflowVersionDescriptor };

  private _workflow_version: WorkflowVersionDescriptor;

  versions: WorkflowVersionDescriptor[];

  @Output() workflow_version = new EventEmitter<WorkflowVersion>();
  @Output() loadingWorkflowVersion = new EventEmitter<Workflow>();

  @ViewChild('searchInputText') selectPicker: ElementRef;

  // initialize logger
  private logger: Logger = LoggerManager.create(
    'WorkflowVersionSelectorComponent'
  );

  constructor(
    private appService: AppService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    this.logger.debug('Change detected');
    $('.selectpicker').selectpicker();
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

  public selectVersion(version: string) {
    this.logger.debug('Selected workflow version:', version);
    this._workflow_version = this._versions_map[version];
    this.logger.debug('Selected workflow version:', this._workflow_version);
    this.loadingWorkflowVersion.next(this._workflow);
    let wv = this.workflow.getVersion(version);
    if (!wv) {
      this.appService
        .loadWorkflowVersion(this.workflow, version, true)
        .subscribe((v: WorkflowVersion) => {
          this.workflow.addVersion(v, true);
          this.workflow_version.emit(v);
          this.loadingWorkflowVersion.next(null);
        });
    } else {
      this.workflow.currentVersion = wv;
      this.workflow_version.emit(wv);
      this.loadingWorkflowVersion.next(null);
    }
  }
}
