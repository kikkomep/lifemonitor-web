import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  BarElement,
  Chart,
  ChartData,
  ChartDataset,
  ChartOptions,
  ChartType,
} from 'chart.js';
import { Subscription } from 'rxjs';
import { DateUtils } from 'src/app/models/common.models';
import { StatusStatsItem } from 'src/app/models/stats.model';
import { TestBuild } from 'src/app/models/testBuild.models';
import { Logger, LoggerManager } from 'src/app/utils/logging';

import { formatDuration } from 'src/app/utils/shared/utils';

@Component({
  selector: 'stats-bar-chart',
  templateUrl: './stats-bar-chart.component.html',
  styleUrls: ['./stats-bar-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsBarChartComponent
  implements OnInit, OnChanges, AfterViewChecked {
  @Input() stats!: StatusStatsItem[];
  @Input() chartWidth: string = '340px';
  @Input() chartHeight: string = '200px';
  @Input() showTitle: boolean = true;
  @Output() selectedItem = new EventEmitter<StatusStatsItem>();

  // initialize logger
  private logger: Logger = LoggerManager.create('StatsBarChartComponent');

  basicData: any;

  basicOptions: any;

  basicDatasets: Array<any>;

  // duration stsatistics
  minDuration: number;
  maxDuration: number;
  averageDuration: number;

  subscription: Subscription;

  public selectedObject: StatusStatsItem;

  public barChartData: ChartDataset[] = [];

  public barColors = [];

  private colorMap = {
    passed: { color: '#1f8787' },
    failed: { color: '#dc3545' },
    error: { color: '#ffc107' },
    aborted: { color: '#6c757d' },
    running: { color: '#17a2b8' },
    waiting: { color: '#fd7e14' },
  };

  constructor(private router: Router, private zone: NgZone) {}

  ngOnInit(): void {
    // initialize datasets
    this.initializeDatasets();
    // initialize options
    this.basicOptions = this.setOptions();
  }

  ngAfterViewChecked(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    this.zone.runOutsideAngular(() => {
      this.initializeDatasets();
    });
  }

  public getItemByIndex(index: number): any {
    return this.basicData[0]?.data[index];
  }

  public getTestBuildByName(name: string): any {
    return this.stats.find((item) => item.name === name);
  }

  public getItemTestBuild(tooltipItem: any, data: ChartData): TestBuild {
    if (!tooltipItem || !data) return null;
    this.logger.debug('item, data', tooltipItem, data);
    let index = tooltipItem['datasetIndex'];
    return this.stats[index] as TestBuild;
  }

  private setOptions(): any {
    return {
      plugins: {
        title: {
          display: false,
          text: (ctx) => {
            const {
              axis = 'xy',
              intersect,
              mode,
            } = ctx.chart.options.interaction;
            return 'Latest builds';
          },
        },

        legend: {
          labels: {
            color: '#495057',
          },
          display: false,
        },
        tooltip: {
          enabled: false,
          position: 'nearest',

          external: (context) => {
            console.warn('tooltipModel', context);
            // Tooltip Element
            const { chart, tooltip } = context;

            const getOrCreateTooltip = (chart) => {
              let tooltipEl = chart.canvas.parentNode.querySelector('div');

              if (!tooltipEl) {
                tooltipEl = document.createElement('div');
                tooltipEl.classList.add('bar-item-tooltip');
                const table = document.createElement('table');
                table.classList.add('bar-item-table');
                tooltipEl.appendChild(table);
                const caret = document.createElement('div');
                caret.classList.add('bar-item-caret');
                const caretIcon = document.createElement('i');
                caret.classList.add('fas');
                caret.classList.add('fa-caret-right');
                caret.appendChild(caretIcon);
                tooltipEl.appendChild(caret);

                // tooltipElExt.appendChild(caret);
                chart.canvas.parentNode.appendChild(tooltipEl);
              }

              return tooltipEl;
            };

            const tooltipEl = getOrCreateTooltip(chart);

            // Hide if no tooltip
            if (tooltip.opacity === 0) {
              tooltipEl.style.opacity = 0;
              return;
            }

            const makeTd = (type: string = 'detail', width?: string) => {
              const td = document.createElement(
                type === 'detail' ? 'td' : 'th'
              );
              td.style.borderWidth = '0';
              return td;
            };

            const makeRow = (type: string = 'detail', build?: TestBuild) => {
              const tr = document.createElement('tr');
              tr.classList.add(`bar-item-tooltip-${type}`);

              const iconContainer = document.createElement('div');
              iconContainer.classList.add(`bar-item-tooltip-${type}-icon`);

              const textContainer = document.createElement('div');
              textContainer.classList.add(`bar-item-tooltip-${type}-text`);

              const td = makeTd(type, '100%');
              td.appendChild(iconContainer);
              td.appendChild(textContainer);

              tr.appendChild(td);

              return {
                row: tr,
                icon: iconContainer,
                text: textContainer,
                build: build,
                color: this.colorMap[build.status]?.color ?? 'gray',
              };
            };

            // Set Text
            if (tooltip.body) {
              const titleLines = tooltip.title || [];
              const bodyLines = tooltip.title || [];
              const footerLines = tooltip.title || [];

              this.logger.warn('bodyLines', bodyLines);

              const tableHead = document.createElement('thead');

              titleLines.forEach((title) => {
                const build = this.getTestBuildByName(title);

                const titleRowInfo = makeRow('header', build);

                const tr = titleRowInfo.row;

                const span = document.createElement('span');
                span.style.background =
                  this.colorMap[build.status]?.color ?? 'gray';
                span.style.borderColor = 'white';
                span.style.borderWidth = '2px';
                // span.style.marginRight = '5px';
                span.style.height = '12px';
                span.style.width = '12px';
                span.style.display = 'inline-block';
                span.style.borderRadius = '12px';

                const thIcon = titleRowInfo.icon;
                thIcon.appendChild(span);

                const th = titleRowInfo.text;
                const text = document.createTextNode(
                  `Build: #${title}: ${build.status}`
                );
                th.appendChild(text);
                tableHead.appendChild(tr);
              });

              const tableBody = document.createElement('tbody');
              bodyLines.forEach((title, i) => {
                this.logger.warn('body', title, i);
                const colors = tooltip.labelColors[i];
                const item = this.getTestBuildByName(title);

                var style = 'background:' + colors.backgroundColor;

                const startedIcon = document.createElement('i');
                startedIcon.classList.add('far');
                startedIcon.classList.add('fa-clock');

                const startedDiv = document.createElement('div');
                startedDiv.classList.add('flex-row');
                // startedDiv.classList.add('mr-1');
                startedDiv.appendChild(startedIcon);
                startedDiv.appendChild(
                  document.createTextNode(
                    ' started: ' +
                      DateUtils.formatTimestamp(item.timestamp.toString())
                  )
                );

                const startedRow = makeRow('detail', item);
                startedRow.icon.appendChild(startedIcon);
                startedRow.text.appendChild(startedDiv);

                const durationIcon = document.createElement('i');
                durationIcon.classList.add('fas');
                durationIcon.classList.add('fa-stopwatch');

                const durationDiv = document.createElement('div');
                durationDiv.classList.add('flex-row');
                durationDiv.appendChild(durationIcon);
                durationDiv.appendChild(
                  document.createTextNode(
                    ' duration: ' + formatDuration(item.duration)
                  )
                );

                const durationRow = makeRow('detail', item);
                durationRow.icon.appendChild(durationIcon);
                durationRow.text.appendChild(durationDiv);

                tableBody.appendChild(startedRow.row);
                tableBody.appendChild(durationRow.row);
              });

              const tableFooter = document.createElement('tfoot');
              footerLines.forEach((title) => {
                const build = this.getTestBuildByName(title);
                const footerRow = document.createElement('tr');
                const footerTd = document.createElement('td');
                footerTd.colSpan = 2;
                footerTd.classList.add('bar-item-tooltip-footer');
                const footerText = document.createElement('span');
                footerText.innerHTML = `click to see on <b class="text-white">${build.instance.service.type}</b>`;
                footerTd.appendChild(footerText);
                footerRow.appendChild(footerTd);
                tableFooter.appendChild(footerRow);
              });

              // Remove old children
              const tableRoot = tooltipEl.querySelector('table');
              while (tableRoot.firstChild) {
                tableRoot.firstChild.remove();
              }

              // Add new children
              tableRoot.appendChild(tableHead);
              tableRoot.appendChild(tableBody);
              tableRoot.appendChild(tableFooter);

              // tableRoot.parentNode.parentNode.appendChild(caret);
            }

            const {
              offsetLeft: positionX,
              offsetTop: positionY,
            } = chart.canvas;

            // Display, position, and set styles for font
            tooltipEl.style.opacity = 1;
            tooltipEl.style.left = positionX + tooltip.caretX - 115 + 'px';
            tooltipEl.style.top = positionY + tooltip.caretY + 'px';
            tooltipEl.style.font = tooltip.options.bodyFont.string;
            tooltipEl.style.padding =
              tooltip.options.padding +
              'px ' +
              tooltip.options.padding +
              'px';
          },
        },
      },

      scales: {
        x: {
          display: false,
          ticks: {
            color: '#495057',
            min: 0,
          },
          grid: {
            color: '#ebedef',
          },
        },
        y1: {
          display: true,
          position: 'left',
          ticks: {
            display: false,
            min: 0,
          },

          // grid line settings
          grid: {
            drawOnChartArea: false, // only want the grid lines for one axis to show up
          },
          time: { unit: 'second' },
          title: {
            display: true,
            text: 'duration [hh:mm:ss]',
            color: '#034545',
            font: {
              size: 10,
              weight: 'bold',
              lineHeight: 1.2,
            },
            padding: { top: 20, left: 0, right: 0, bottom: 0 },
          },
        },
        y: {
          position: 'right',
          suggestedMin: this.minDuration,
          suggestedMax: this.maxDuration,
          ticks: {
            color: '#495057',
            min: 0,
            label: 'duration (seconds)',
            display: true,
            font: { size: 7, weight: 'normal' },
            callback: function (val: number, index: number) {
              // Hide the label of every 2nd dataset
              console.warn('Formatting duration', val, index);
              return formatDuration(val);
              // return val;
            },
          },
          grid: {
            color: '#ebedef',
          },
          display: true,
          time: { unit: 'second' },
        },
      },
    };
  }

  initializeDatasets() {
    this.basicDatasets = [];

    const passedBuildsDataset = {
      builds: [...this.stats],
      get data(): [] {
        return this['builds'].map((b: TestBuild) =>
          b.status === 'passed' ? b.duration : 0
        );
      },
      label: 'Passing',
      backgroundColor: Array.from(
        { length: this.stats.length },
        () => this.colorMap['passed'].color
      ),
      yAxisID: 'y1',
      order: 4,
      stack: 'builds',
    };

    const failedBuildsDataset = {
      get data(): [] {
        return this['builds'].map((b: TestBuild) =>
          ['failed', 'error'].find((s) => s === b.status) ? b.duration : 0
        );
      },
      builds: [...this.stats],
      label: 'Failing',
      backgroundColor: Array.from(
        { length: this.stats.length },
        () => this.colorMap['failed'].color
      ),
      yAxisID: 'y1',
      order: 5,
      stack: 'builds',
    };

    const builds = passedBuildsDataset.builds;
    const values = passedBuildsDataset.data.filter((d) => d > 0);
    const minDuration = (this.minDuration = Math.min(...values));
    const maxDuration = (this.maxDuration = Math.max(...values));
    const averageDuration = (this.averageDuration =
      values.reduce((a, b) => a + b, 0) / values.length);

    this.logger.debug('Builds: ', builds);
    this.logger.debug('Dataset: ', values);
    this.logger.debug('Min duration: ' + minDuration);
    this.logger.debug('Max duration: ' + maxDuration);
    this.logger.debug('Average duration: ' + averageDuration);

    this.basicDatasets = [
      passedBuildsDataset,
      failedBuildsDataset,
      {
        data: Array.from(
          { length: passedBuildsDataset.data.length },
          () => minDuration
        ),
        label: 'Min Duration',
        backgroundColor: 'rgba(249,178,51,.1)',
        borderColor: 'rgba(249,178,51,1)',
        borderWidth: 2,
        borderDash: [2, 2],
        // tension: 0.1,
        fill: true,
        hitRadius: 10,
        pointRadius: (ctx: any) => {
          return passedBuildsDataset.data[ctx.dataIndex] === minDuration
            ? 5
            : 0;
        },
        yAxisID: 'y1',
        order: 0,
        type: 'line',
        pointStyle: 'star',
        title: 'Min duration: ' + formatDuration(minDuration),
      },
      {
        data: Array.from(
          { length: passedBuildsDataset.data.length },
          () => maxDuration
        ),
        label: 'Max Duration',
        backgroundColor: 'rgba(232,62,140,.5)',
        borderColor: 'rgba(232,62,140,1)',
        borderWidth: 2,
        borderDash: [1, 1],
        // tension: 0.4,
        fill: false,
        pointRadius: (ctx: any) => {
          return passedBuildsDataset.data[ctx.dataIndex] === maxDuration
            ? 5
            : 0;
        },
        yAxisID: 'y1',
        order: 1,
        type: 'line',
        pointStyle: 'triangle',
      },
      {
        data: Array.from(
          { length: passedBuildsDataset.data.length },
          () => averageDuration
        ),
        label: 'Avg Duration',
        backgroundColor: 'rgba(23,162,184,.1)',
        borderColor: 'rgba(23,162,184,1)',
        borderWidth: 1,
        borderDash: [5, 5],
        // tension: 0.1,
        fill: false,
        pointRadius: (ctx: any) => {
          return passedBuildsDataset.data[ctx.dataIndex] === averageDuration
            ? 5
            : 0;
        },
        yAxisID: 'y1',
        order: 2,
        type: 'line',
        pointStyle: 'cross',
      },
    ];

    this.basicData = {
      labels: this.stats.map((s) => s.name),
      datasets: this.basicDatasets,
    };
  }

  public chartClicked(e: any) {
    this.logger.debug('Chart click event', e);
    if (!e || !e.element) return;
    let el: { element: BarElement; datasetIndex: number; index: number } =
      e.element;
    this.logger.debug('Chart element clicked', el);

    let dataset = this.basicDatasets[el.datasetIndex];
    this.logger.debug('Chart dataset clicked', dataset);
    let item = dataset.builds[el.index];
    this.logger.debug('Chart item clicked', item);
    this.selectedObject = item;
    if (!item) return;

    this.selectedItem.emit(this.selectedObject);
  }

  public chartHovered({
    event,
    active,
  }: {
    event: MouseEvent;
    active: {}[];
  }): void {
    this.logger.debug('chartHovered Event', event, active);
  }
}
