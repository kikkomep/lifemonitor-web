import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Router } from '@angular/router';
import { InstanceStats } from 'src/app/models/stats.model';
import { Suite } from 'src/app/models/suite.models';
import { TestBuild } from 'src/app/models/testBuild.models';
import { TestInstance } from 'src/app/models/testInstance.models';
import { Workflow } from 'src/app/models/workflow.model';
import { AppService } from 'src/app/utils/services/app.service';

@Component({
  selector: 'test-instances',
  templateUrl: './test-instances.component.html',
  styleUrls: ['./test-instances.component.scss'],
})
export class TestInstancesComponent implements OnInit {
  @Input() workflow: Workflow;
  @Input() testInstances: TestInstance[];
  @Output() suiteSelected = new EventEmitter<TestInstance>();

  constructor(
    private appService: AppService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

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
      // this.appService.observableWorkflow.subscribe((w: Workflow) => {
      //   // this.appService
      //   //   .selectTestSuite(testBuild.suite_uuid)
      //   this.appService.observableTestSuite
      //     .subscribe((s: Suite) => {
      //       console.log('Selected suite from wf cmp: ', s);
      //       this.appService
      //         .selectTestInstance(testBuild.instance.uuid)
      //         .subscribe((ti) => {
      //           console.log('Selected test instance from wf component', ti);
      //           // this.router.navigate(['/build'], {
      //           //   queryParams: {
      //           //     instance_uuid: testBuild.instance.uuid,
      //           //     build_id: testBuild.build_id,
      //           //   },
      //           // });
      //           console.log(
      //             'TestBuild external link: ',
      //             testBuild.externalLink
      //           );
      //           window.open(testBuild.externalLink, '_blank');
      //         });
      //     });
      // });
      this.appService.selectWorkflow(
        testBuild.testInstance.suite.workflow.uuid
      );
    }
  }
}
