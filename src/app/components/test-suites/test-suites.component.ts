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
}
