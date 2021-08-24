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
import { Chart, ChartDataSets, ChartOptions, ChartType } from 'chart.js';
//import * as pluginDataLabels from 'chartjs-plugin-datalabels';
import { Label } from 'ng2-charts';

import { StatusStatsItem } from 'src/app/models/stats.model';

@Component({
  selector: 'stats-bar-chart',
  templateUrl: './stats-bar-chart.component.html',
  styleUrls: ['./stats-bar-chart.component.scss'],
})
export class StatsBarChartComponent implements OnInit, OnChanges {
  @Input() stats!: StatusStatsItem[];
  @Output() selectedItem = new EventEmitter<StatusStatsItem>();

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
    plugins: {
      datalabels: {
        anchor: 'end',
        align: 'end',
      },
    },
    legend: {
      position: 'right',
    },
  };
  public barChartLabels: Label[] = ['Build'];
  public barChartType: ChartType = 'bar';
  public barChartLegend = false;
  public barChartPlugins = []; //[pluginDataLabels];

  public barColors = [];

  private mappings = {
    passed: { color: '#1f8787', label: 'Passed' },
    failed: { color: '#dc3545', label: 'Failed' },
    error: { color: '#ffc107', label: 'Failed' },
    aborted: { color: '#6c757d', label: 'Aborted' },
    running: { color: '#17a2b8', label: 'Running' },
    waiting: { color: '#fd7e14', label: 'Waiting' },
  };

  public selectedObject: StatusStatsItem;

  constructor(private router: Router) {}

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

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    // console.log('Stats ', this.stats);
    this.barChartData = [];
    this.barColors = [];
    for (let i in this.stats) {
      let build: StatusStatsItem = this.stats[i];
      console.log('build....', build);
      this.barChartData.push({
        data: [build.duration],
        label: this.mappings[build.status]['label'],
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
    console.log(event, active);
    if (!active || active.length == 0) return;
    let chart: Chart = active[0]._chart;
    let selectedElements: [{}] = chart.getElementAtEvent(event);
    if (selectedElements && selectedElements.length == 1) {
      let element = selectedElements[0];
      let dataIndex: number = element['_datasetIndex'];
      let data = this.barChartData[dataIndex];
      this.selectedObject = this.stats[dataIndex];
      console.log('Data selected', chart, data, this.selectedObject);
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
    console.log(event, active);
  }
}
