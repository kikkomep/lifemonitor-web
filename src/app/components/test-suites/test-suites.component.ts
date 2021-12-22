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
import { Suite } from 'src/app/models/suite.models';
import { TestBuild } from 'src/app/models/testBuild.models';
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

  private suitesDataTable: any;

  constructor(
    private appService: AppService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void { }

  ngAfterViewInit() {
    this.initDataTable();
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('Change detected');
    this.cdr.detectChanges();
  }

  public selectTestBuild(testBuild: TestBuild) {
    console.log('TestBuild', testBuild);
    if (testBuild) {
      console.log('Test Build selected', testBuild);
      window.open(testBuild.externalLink, '_blank');
      this.suiteSelected.emit(testBuild);
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
      "autoWidth": true,
      "responsive": true,
      "deferRender": true,
      stateSave: true
    });
  }

  private destroyDataTable() {
    if (this.suitesDataTable) {
      this.suitesDataTable.destroy();
      this.suitesDataTable = null;
    }
  }
}
