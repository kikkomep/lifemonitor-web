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
import { Suite } from 'src/app/models/suite.models';
import { TestBuild } from 'src/app/models/testBuild.models';
import { Logger, LoggerManager } from 'src/app/utils/logging';
import { AppService } from 'src/app/utils/services/app.service';

declare var $: any;

@Component({
  selector: 'test-suites',
  templateUrl: './test-suites.component.html',
  styleUrls: ['./test-suites.component.scss'],
})
export class TestSuitesComponent implements OnInit, OnChanges {
  @Input() suites: Suite[];
  @Output() suiteSelected = new EventEmitter<TestBuild>();

  // initialize logger
  private logger: Logger = LoggerManager.create('TestSuitesComponent');

  private suitesDataTable: any;

  private clickHandler: MouseClickHandler = new MouseClickHandler();

  constructor(
    private appService: AppService,
    private toastService: ToastrService,
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

  public isUserLogged(): boolean {
    return this.appService.isUserLogged();
  }

  public selectTestBuild(testBuild: TestBuild) {
    this.logger.debug('TestBuild', testBuild);
    if (testBuild) {
      this.logger.debug('Test Build selected', testBuild);
      window.open(testBuild.externalLink, '_blank');
      this.suiteSelected.emit(testBuild);
      this.appService.selectWorkflowVersion(
        testBuild.testInstance.suite.workflow.uuid
      );
    }
  }

  private refreshDataTable() {
    this.destroyDataTable();
    this.initDataTable();
  }

  private initDataTable() {
    if (this.suitesDataTable) return;
    this.suitesDataTable = $("#workflowSuites").DataTable({
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
      // "scrollY": "520",
      "stateSave": true,
      language: {
        search: "",
        searchPlaceholder: "Filter your dashboard",
        "decimal": "",
        "emptyTable": "No suites associated to the current workflow",
        "info": "Showing _START_ to _END_ of _TOTAL_ suites",
        "infoEmpty": "Showing 0 to 0 of 0 suites",
        "infoFiltered": "(filtered from a total of _MAX_ suites)",
        "infoPostFix": "",
        "thousands": ",",
        "lengthMenu": "Show _MENU_ suites",
        "loadingRecords": "Loading suites...",
        "processing": "Processing suites...",
        "zeroRecords": "No matching suites found",
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
    if (this.suitesDataTable) {
      this.suitesDataTable.destroy();
      this.suitesDataTable = null;
    }
  }

  public isEditable(s: Suite) {
    return this.appService.isEditable(s ? s.workflow : null);
  }

  public enableSuiteEditing(suite: Suite) {
    this.clickHandler.doubleClick(() => {
      if (this.isUserLogged() && this.isEditable(suite)) {
        suite['editingMode'] = true;
        suite['oldName'] = suite.name;
      }
    });
  }

  public restoreSuite(suite: Suite) {
    suite.name = suite['oldName'];
    suite['editingMode'] = false;
  }

  public updateSuite(suite: Suite) {
    this.appService.updateSuite(suite).subscribe(() => {
      suite['editingMode'] = false;
      this.toastService.success("Test Suite updated!", '', { timeOut: 2500 });
    },
      (error) => {
        this.toastService.error("Unable to update test suite", '', { timeOut: 2500 });
        this.logger.error(error);
      }
    );
  }

  public showSuiteDetails(suite: Suite) {
    this.clickHandler.click(() => {
      this.router.navigate(['/suite', { s: suite.asUrlParam() }]);
    });
  }
}
