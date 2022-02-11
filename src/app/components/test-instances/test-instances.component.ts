import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { MouseClickHandler } from 'src/app/models/common.models';
import { TestBuild } from 'src/app/models/testBuild.models';
import { TestInstance } from 'src/app/models/testInstance.models';
import { Workflow } from 'src/app/models/workflow.model';
import { Logger, LoggerManager } from 'src/app/utils/logging';
import { AppService } from 'src/app/utils/services/app.service';

declare var $: any;

@Component({
  selector: 'test-instances',
  templateUrl: './test-instances.component.html',
  styleUrls: ['./test-instances.component.scss'],
})
export class TestInstancesComponent implements OnInit, OnChanges {
  @Input() workflow: Workflow;
  @Input() testInstances: TestInstance[];
  @Output() suiteSelected = new EventEmitter<TestInstance>();

  private suiteInstancesDataTable: any;
  private clickHandler: MouseClickHandler = new MouseClickHandler();

  // initialize logger
  private logger: Logger = LoggerManager.create('TestInstancesComponent');

  constructor(
    private appService: AppService,
    private toast: ToastrService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void { }

  ngAfterViewInit() {
    this.initDataTable();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.logger.debug('Change detected');
    this.cdr.detectChanges();
  }

  public selectTestInstance(testInstance: TestInstance) {
    this.logger.debug('Selected TestInstace: ', testInstance);
  }

  public selectTestBuild(testBuild: TestBuild) {
    this.logger.debug('TestBuild', testBuild);
    if (testBuild) {
      this.logger.debug('Test Build selected', testBuild);
      // this.suiteSelected.emit(testBuild);
      window.open(testBuild.externalLink, '_blank');
      this.appService.selectWorkflow(
        testBuild.testInstance.suite.workflow.uuid
      );
    }
  }

  private refreshDataTable() {
    this.destroyDataTable();
    this.initDataTable();
  }

  private initDataTable() {
    if (this.suiteInstancesDataTable) return;
    this.suiteInstancesDataTable = $("#suiteInstances").DataTable({
      "paging": true,
      "lengthChange": true,
      "lengthMenu": [5, 10, 20, 50, 75, 100],
      "searching": true,
      "ordering": true,
      "order": [[1, 'asc']],
      "columnDefs": [{
        "targets": [0, 3, 4],
        "orderable": false
      }],
      "info": true,
      "autoWidth": false,
      "responsive": true,
      "deferRender": true,
      "stateSave": true,
      // "scrollY": "520",
      language: {
        search: "",
        searchPlaceholder: "Filter by UUID or name",
        "decimal": "",
        "emptyTable": "No instances associated to the current test suite",
        "info": "Showing _START_ to _END_ of _TOTAL_ instances",
        "infoEmpty": "Showing 0 to 0 of 0 instances",
        "infoFiltered": "(filtered from a total of _MAX_ instances)",
        "infoPostFix": "",
        "thousands": ",",
        "lengthMenu": "Show _MENU_ instances",
        "loadingRecords": "Loading instances...",
        "processing": "Processing instances...",
        "zeroRecords": "No matching instances found",
        "paginate": {
          "first": "First",
          "last": "Last",
          "next": "Next",
          "previous": "Previous"
        },
        "aria": {
          "sortAscending": ": activate to sort column ascending",
          "sortDescending": ": activate to sort column descending"
        }
      }
    });
  }

  private destroyDataTable() {
    if (this.suiteInstancesDataTable) {
      this.suiteInstancesDataTable.destroy();
      this.suiteInstancesDataTable = null;
    }
  }

  public isUserLogged(): boolean {
    return this.appService.isUserLogged();
  }

  public enableTestInstanceEditing(instance: TestInstance) {
    this.clickHandler.doubleClick(() => {
      if (this.isUserLogged()) {
        instance['oldName'] = instance.name;
        instance['editingMode'] = true;
      }
    });
  }

  public restoreTestInstance(instance: TestInstance) {
    instance.name = instance['oldName'];
    instance['editingMode'] = false;
  }

  public updateTestInstance(instance: TestInstance) {
    this.appService.updateTestInstance(instance).subscribe(() => {
      instance['editingMode'] = false;
      this.toast.success("Test instance updated!", '', { timeOut: 2500 });
    },
      (error) => {
        this.toast.error("Unable to update test instance", '', { timeOut: 2500 });
        this.logger.error(error);
      });
  }

  public showTestInstanceDetails(instance: TestInstance) {
    this.clickHandler.click(() => {
      window.open(instance.externalLink, "_blank");
    });
  }
}
