/*
Copyright (c) 2020-2024 CRS4

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { MouseClickHandler } from 'src/app/models/common.models';
import { Suite } from 'src/app/models/suite.models';
import { TestBuild } from 'src/app/models/testBuild.models';
import { Logger, LoggerManager } from 'src/app/utils/logging';
import { AppService } from 'src/app/utils/services/app.service';

declare var $: any;

const minWidthForListLayout: number = 768;

@Component({
  selector: 'test-suites',
  templateUrl: './test-suites.component.html',
  styleUrls: ['./test-suites.component.scss'],
})
export class TestSuitesComponent implements OnInit, OnChanges {
  @Input() suites: Suite[];
  @Output() suiteSelected = new EventEmitter<TestBuild>();

  @ViewChild('suitesDataView')
  dataView: any;

  // initialize logger
  private logger: Logger = LoggerManager.create('TestSuitesComponent');

  private suitesDataTable: any;

  private clickHandler: MouseClickHandler = new MouseClickHandler();

  private enableAutoLayoutSwitch: boolean = false;

  constructor(
    private appService: AppService,
    private toastService: ToastrService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit() {
    this.checkWindowSize();
  }

  private checkWindowSize() {
    if (this.enableAutoLayoutSwitch) {
      if (window.innerWidth < minWidthForListLayout) {
        this.dataView.layout = 'grid';
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.logger.debug('Change detected');
    this.cdr.detectChanges();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    if (this.enableAutoLayoutSwitch) {
      this.logger.debug('Resize', event.target.innerWidth);
      if (event.target.innerWidth < minWidthForListLayout) {
        this.dataView.layout = 'grid';
        this.cdr.detectChanges();
      }
    }
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
    this.suitesDataTable = $('#workflowSuites').DataTable({
      paging: true,
      lengthChange: true,
      lengthMenu: [5, 10, 20, 50, 75, 100],
      searching: false,
      ordering: true,
      order: [[1, 'asc']],
      columnDefs: [
        {
          targets: [0, 3, 4],
          orderable: false,
        },
      ],
      info: true,
      autoWidth: true,
      responsive: false,
      deferRender: false,
      scrollX: 1200,
      // "scrollY": "520",
      stateSave: true,
      language: {
        search: '',
        searchPlaceholder: 'Filter your dashboard',
        decimal: '',
        emptyTable: 'No suites associated to the current workflow',
        info: 'Showing _START_ to _END_ of _TOTAL_ suites',
        infoEmpty: 'Showing 0 to 0 of 0 suites',
        infoFiltered: '(filtered from a total of _MAX_ suites)',
        infoPostFix: '',
        thousands: ',',
        lengthMenu: 'Show _MENU_ suites',
        loadingRecords: 'Loading suites...',
        processing: 'Processing suites...',
        zeroRecords: 'No matching suites found',
        paginate: {
          first: 'First',
          last: 'Last',
          next: 'Next',
          previous: 'Previous',
        },
        aria: {
          sortAscending: ': activate to sort column ascending',
          sortDescending: ': activate to sort column descending',
        },
      },
    });
    // Add tooltip to the SearchBox
    // $('input[type=search]')
    //   .attr('data-placement', 'top')
    //   .attr('data-toggle', 'tooltip')
    //   .attr('data-html', 'true')
    //   .attr('pTooltip', 'Filter by UUID or Name');
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
    this.appService.updateSuite(suite).subscribe(
      () => {
        suite['editingMode'] = false;
        this.toastService.success('Test Suite updated!', '', { timeOut: 2500 });
      },
      (error) => {
        this.toastService.error('Unable to update test suite', '', {
          timeOut: 2500,
        });
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
