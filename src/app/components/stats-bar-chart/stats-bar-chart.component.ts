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
  Chart,
  ChartData,
  ChartDataSets,
  ChartOptions,
  ChartType,
} from 'chart.js';
import { Label } from 'ng2-charts';
import { DateUtils } from 'src/app/models/common.models';
import { StatusStatsItem } from 'src/app/models/stats.model';
import { TestBuild } from 'src/app/models/testBuild.models';
import { Logger, LoggerManager } from 'src/app/utils/logging';

@Component({
  selector: 'stats-bar-chart',
  templateUrl: './stats-bar-chart.component.html',
  styleUrls: ['./stats-bar-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsBarChartComponent
  implements OnInit, OnChanges, AfterViewChecked {
  @Input() stats!: StatusStatsItem[];
  @Output() selectedItem = new EventEmitter<StatusStatsItem>();

  // initialize logger
  private logger: Logger = LoggerManager.create('StatsBarChartComponent');

  public barChartOptions: ChartOptions = {
    responsive: true,
    // We use these empty structures as placeholders for dynamic theming.
    scales: {
      xAxes: [{ display: false }],
      yAxes: [
        {
          // ticks: {
          //   minor: {},
          // },
          display: false,
          time: {
            unit: 'second',
          },
        },
      ],
    },
    tooltips: {
      enabled: false,
      footerFontSize: 9,
      footerFontColor: 'lightgray',
      footerAlign: 'right',
      custom: function (tooltipModel) {
        // Tooltip Element
        var tooltipEl = document.getElementById('chartjs-tooltip');

        // Create element on first render
        if (!tooltipEl) {
          tooltipEl = document.createElement('div');
          tooltipEl.style.background = 'black';
          tooltipEl.style.color = 'white';
          tooltipEl.style.fontWeight = '200';
          tooltipEl.id = 'chartjs-tooltip';
          tooltipEl.style.borderRadius = '10px';
          tooltipEl.innerHTML = '<table></table>';
          document.body.appendChild(tooltipEl);
        }

        // Hide if no tooltip
        if (tooltipModel.opacity === 0) {
          tooltipEl.style.opacity = '0';
          return;
        }

        // Set caret Position
        tooltipEl.classList.remove('above', 'below', 'no-transform');
        if (tooltipModel.yAlign) {
          tooltipEl.classList.add(tooltipModel.yAlign);
        } else {
          tooltipEl.classList.add('no-transform');
        }

        function getBody(bodyItem: { lines: any }) {
          return bodyItem.lines;
        }

        // Set Text
        if (tooltipModel.body) {
          var titleLines = tooltipModel.title || [];
          var bodyLines = tooltipModel.body.map(getBody);
          // set header
          var innerHtml = '<thead>';
          titleLines.forEach(function (title) {
            innerHtml += '<tr>' + '<th>' + title + '</th></tr>';
          });
          innerHtml += '</thead><tbody>';
          // set body
          bodyLines.forEach(function (body, i) {
            var colors = tooltipModel.labelColors[i];
            var style = 'background:' + colors.backgroundColor;
            style += '; border-color:' + colors.borderColor;
            style += '; border-width: 2px';
            var span = '<span style="' + style + '"></span>';
            innerHtml += '<tr><td>' + span + body + '</td></tr>';
          });
          innerHtml += '</tbody>';
          // append footer
          var footer =
            '<div style="color: lightgray; font-size: 8pt; text-align: right;">';
          footer += tooltipModel.footer;
          footer += '</div>';
          innerHtml += footer;
          // append table
          var tableRoot = tooltipEl.querySelector('table');
          tableRoot.innerHTML = innerHtml;
        }

        // `this` will be the overall tooltip
        var position = this._chart.canvas.getBoundingClientRect();

        // Display, position, and set styles for font
        tooltipEl.style.opacity = '1';
        tooltipEl.style.position = 'absolute';
        tooltipEl.style.left =
          position.left + window.pageXOffset + tooltipModel.caretX + 'px';
        tooltipEl.style.top =
          position.top + window.pageYOffset + tooltipModel.caretY + 'px';
        tooltipEl.style.fontFamily = tooltipModel._bodyFontFamily;
        tooltipEl.style.fontSize = tooltipModel.bodyFontSize + 'px';
        tooltipEl.style.fontStyle = tooltipModel._bodyFontStyle;
        tooltipEl.style.padding =
          tooltipModel.yPadding + 'px ' + tooltipModel.xPadding + 'px';
        tooltipEl.style.pointerEvents = 'none';
      },
      callbacks: {
        title: (tooltipItem, data: ChartData) => {
          let item: TestBuild = this.getItemTestBuild(tooltipItem[0], data);
          return (
            '<span style="color: transparent; font-size: 0.7rem; text-shadow: 0 0 0 ' +
            item.color +
            '; ">&#9899;</span>' +
            ' Build #' +
            item.build_id +
            ' : ' +
            item.status
          );
        },
        label: (tooltipItem, data: ChartData) => {
          let item: TestBuild = this.getItemTestBuild(tooltipItem, data);
          this.logger.debug('Check stats item', tooltipItem, data);
          let label = data.labels[tooltipItem.index];
          let sec = data.datasets[tooltipItem.datasetIndex].data[
            tooltipItem.index
          ] as number;
          let duration = '';
          let hours = Math.floor(sec / 3600);
          let minutes = Math.floor((sec - hours * 3600) / 60);
          let seconds = sec - hours * 3600 - minutes * 60;
          if (hours > 0) duration += hours + 'h ';
          if (minutes > 0) duration += minutes + 'm ';
          if (sec >= 0) duration += seconds + 's';
          this.logger.debug(
            'DURATION',
            hours,
            minutes,
            seconds,
            duration,
            tooltipItem,
            item,
            data
          );
          let ltext =
            '<div class="ml-1"><i class="far fa-calendar-check"></i> started: ' +
            DateUtils.formatTimestamp(item.timestamp.toString()) +
            '</div>';
          ltext +=
            '<div class="ml-1"><i class="fas fa-stopwatch"></i> duration: ' +
            duration +
            '</div>';
          return ltext;
        },
        footer: (tooltipItem, data) => {
          let index = tooltipItem[0]['datasetIndex'];
          let item = this.stats[index] as TestBuild;
          return (
            'click to see on <b class="text-white">' +
            item.instance.service.type +
            '</b>'
          );
        },
      },
    },
    plugins: {
      datalabels: {
        anchor: 'end',
        align: 'end',
      },
    },
    legend: {
      position: 'top',
    },
  };
  public barChartLabels: Label[] = ['build'];
  public barChartType: ChartType = 'bar';
  public barChartLegend = false;
  public barChartPlugins = []; //[pluginDataLabels];

  public barColors = [];

  private mappings = {
    passed: { color: '#1f8787' },
    failed: { color: '#dc3545' },
    error: { color: '#ffc107' },
    aborted: { color: '#6c757d' },
    running: { color: '#17a2b8' },
    waiting: { color: '#fd7e14' },
  };

  public getItemTestBuild(tooltipItem: any, data: ChartData): TestBuild {
    if (!tooltipItem || !data) return null;
    this.logger.debug('item, data', tooltipItem, data);
    let index = tooltipItem['datasetIndex'];
    return this.stats[index] as TestBuild;
  }

  public selectedObject: StatusStatsItem;

  constructor(private router: Router, private zone: NgZone) {}

  public barChartData: ChartDataSets[] = [];

  ngOnInit(): void {}

  ngAfterViewChecked(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    this.zone.runOutsideAngular(() => {
      this.refresh();
    });
  }

  refresh() {
    // this.logger.debug('Stats ', this.stats);
    this.barChartData = [];
    this.barColors = [];
    this.logger.debug('Current bar stas: ', this.stats);
    let max: number = Math.max.apply(
      Math,
      this.stats.map(function (o) {
        return o.duration || 0;
      })
    );
    this.logger.debug('MAX duration', max);
    for (let i in this.stats) {
      let build: StatusStatsItem = this.stats[i];
      this.barChartData.push({
        data: [build.duration || 0],
        label: 'duration',
      });
      this.barColors.push(this.getColor(build.status));
    }
  }

  private getColor(label: string) {
    return {
      // first color
      backgroundColor:
        label in this.mappings ? this.mappings[label].color : 'gray',
      borderColor: 'rgba(225,10,24,0.2)',
      pointBackgroundColor: 'rgba(225,10,24,0.2)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(225,10,24,0.2)',
    };
  }

  // events
  public chartClicked({
    event,
    active,
  }: {
    event: MouseEvent;
    active: { _chart: any }[];
  }): void {
    this.logger.debug('Chart click event', event, active);
    if (!active || active.length == 0) return;
    let chart: Chart = active[0]._chart;
    let selectedElements: [{}] = chart.getElementAtEvent(event);
    if (selectedElements && selectedElements.length == 1) {
      let element = selectedElements[0];
      let dataIndex: number = element['_datasetIndex'];
      let data = this.barChartData[dataIndex];
      this.selectedObject = this.stats[dataIndex];
      this.logger.debug('Data selected', chart, data, this.selectedObject);
      this.selectedItem.emit(this.selectedObject);
    } else {
      this.selectedObject = null;
    }
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
