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
import { TestBuild } from 'src/app/models/testBuild.models';
import { TestInstance } from 'src/app/models/testInstance.models';
import { Workflow } from 'src/app/models/workflow.model';
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

  constructor(
    private appService: AppService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit() {
    this.initDataTable();
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('Change detected');
    this.cdr.detectChanges();
  }

  public selectTestInstance(event, testInstance: TestInstance) {
    console.log('Selected TestInstace: ', testInstance);
  }

  public selectTestBuild(testBuild: TestBuild) {
    console.log('TestBuild', testBuild);
    if (testBuild) {
      console.log('Test Build selected', testBuild);
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
      "autoWidth": true,
      "responsive": true,
      "deferRender": true,
      stateSave: true
    });
  }

  private destroyDataTable() {
    if (this.suiteInstancesDataTable) {
      this.suiteInstancesDataTable.destroy();
      this.suiteInstancesDataTable = null;
    }
  }
}
