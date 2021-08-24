import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Router } from '@angular/router';
import { Suite } from 'src/app/models/suite.models';
import { TestBuild } from 'src/app/models/testBuild.models';
import { Workflow } from 'src/app/models/workflow.model';
import { AppService } from 'src/app/utils/services/app.service';

@Component({
  selector: 'test-suites',
  templateUrl: './test-suites.component.html',
  styleUrls: ['./test-suites.component.scss'],
})
export class TestSuitesComponent implements OnInit, OnChanges {
  @Input() suites: Suite[];
  @Output() suiteSelected = new EventEmitter<TestBuild>();

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

  public selectTestBuild(testBuild: TestBuild) {
    console.log("TestBuild", testBuild);
    if (testBuild) {
      console.log('Test Build selected', testBuild);
      this.suiteSelected.emit(testBuild);
      this.appService
        .selectWorkflow(testBuild.testInstance.suite.workflow.uuid)
        .subscribe((w: Workflow) => {
          this.appService
            .selectTestSuite(testBuild.suite_uuid)
            .subscribe((s: Suite) => {
              console.log('Selected suite from wf cmp: ', s);
              this.appService
                .selectTestInstance(testBuild.instance.uuid)
                .subscribe((ti) => {
                  console.log('Selected test instance from wf component', ti);
                  // this.router.navigate(['/build'], {
                  //   queryParams: {
                  //     instance_uuid: testBuild.instance.uuid,
                  //     build_id: testBuild.build_id,
                  //   },
                  // });
                  console.log("TestBuild external link: ", testBuild.externalLink);
                  window.open(testBuild.externalLink, "_blank");
                });
            });
        });
    }
  }
}
