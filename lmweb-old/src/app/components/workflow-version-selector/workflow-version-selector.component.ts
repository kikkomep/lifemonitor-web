import {
  Component,
  EventEmitter,
  Input, OnInit,
  Output
} from '@angular/core';
import {
  Workflow,
  WorkflowVersion,
  WorkflowVersionDescriptor
} from 'src/app/models/workflow.model';
import { Logger, LoggerManager } from 'src/app/utils/logging';
import { AppService } from 'src/app/utils/services/app.service';

@Component({
  selector: 'workflow-version-selector',
  templateUrl: './workflow-version-selector.component.html',
  styleUrls: ['./workflow-version-selector.component.scss'],
})
export class WorkflowVersionSelectorComponent implements OnInit {
  private _workflow: Workflow;
  private _versions_map: { [name: string]: WorkflowVersionDescriptor };
  private _workflow_version: WorkflowVersionDescriptor;

  @Output() workflow_version = new EventEmitter<WorkflowVersion>();
  @Output() loadingWorkflowVersion = new EventEmitter<Workflow>();

  // initialize logger
  private logger: Logger = LoggerManager.create(
    'WorkflowVersionSelectorComponent'
  );

  constructor(private appService: AppService) { }

  ngOnInit(): void { }

  @Input()
  set workflow(w: Workflow) {
    this.logger.debug('Setting workflow version: ', w);
    this._workflow = w;
    this._versions_map = {};
    w.versionDescriptors.forEach(
      (v: WorkflowVersionDescriptor, index) => (this._versions_map[v.name] = v)
    );
    this.logger.debug('Version map:', this._versions_map);
  }

  get workflow(): Workflow {
    return this._workflow;
  }

  get versions(): WorkflowVersionDescriptor[] {
    return this._workflow ? this._workflow.versionDescriptors : null;
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
