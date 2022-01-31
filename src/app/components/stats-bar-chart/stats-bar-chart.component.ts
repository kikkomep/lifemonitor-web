import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Router } from '@angular/router';
import { ChartData, ChartDataSets, ChartOptions, ChartType } from 'chart.js';
import { Label } from 'ng2-charts';
import { StatusStatsItem } from 'src/app/models/stats.model';
import { TestBuild } from 'src/app/models/testBuild.models';
import { Logger, LoggerManager } from 'src/app/utils/logging';

@Component({
  selector: 'stats-bar-chart',
  templateUrl: './stats-bar-chart.component.html',
  styleUrls: ['./stats-bar-chart.component.scss'],
})
export class StatsBarChartComponent implements OnInit, OnChanges {
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
          display: false,
          time: {
            unit: 'hour',
          },
        },
      ],
    },
    tooltips: {
      enabled: true,
      footerFontSize: 9,
      footerFontColor: 'lightgray',
      footerAlign: 'right',
      callbacks: {
        title: (tooltipItem, data: ChartData) => {
          let index = tooltipItem[0]['datasetIndex'];
          let item = this.stats[index] as TestBuild;
          return 'Build ' + item.build_id + ' : ' + item.status;
        },
        label: (tooltipItem, data) => {
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
          this.logger.debug("DURATION", hours, minutes, seconds, duration, tooltipItem, data);
          return ' duration ' + duration;
        },
        footer: (tooltipItem, data) => {
          let index = tooltipItem[0]['datasetIndex'];
          let item = this.stats[index] as TestBuild;
          return 'click to see on ' + item.instance.service.type;
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

  public selectedObject: StatusStatsItem;

  constructor(private router: Router) { }

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

  public barChartData: ChartDataSets[] = [];

  ngOnInit(): void { }

  ngOnChanges(changes: SimpleChanges): void {
    // this.logger.debug('Stats ', this.stats);
    this.barChartData = [];
    this.barColors = [];
    for (let i in this.stats) {
      let build: StatusStatsItem = this.stats[i];
      this.barChartData.push({
        data: [build.duration],
        label: 'duration',
      });
      this.barColors.push(this.getColor(build.status));
    }
  }

  // events
  public chartClicked({
    event,
    active,
  }: {
    event: MouseEvent;
    active: { _chart: any }[];
  }): void {
    this.logger.debug("Chart click event", event, active);
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
    this.logger.debug("chartHovered Event", event, active);
  }
}
