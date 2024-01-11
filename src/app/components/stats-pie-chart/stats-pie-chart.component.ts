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
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  NgZone,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { ChartType } from 'chart.js';
import {
  AbstractStats,
  AggregatedStatusStats,
  InstanceStats,
} from 'src/app/models/stats.model';
import { Logger, LoggerManager } from 'src/app/utils/logging';

@Component({
  selector: 'stats-pie-chart',
  templateUrl: './stats-pie-chart.component.html',
  styleUrls: ['./stats-pie-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsPieChartComponent implements OnInit, OnChanges {
  _stats: AbstractStats = null;

  @Input() showTitle: boolean = true;
  @Input() titleText: string = '';

  public pieChartLabels: Array<string> = [];

  public pieChartData: any;
  public pieChartType: ChartType = 'pie';
  public pieChartLegend = false;
  public pieChartPlugins = [];

  // initialize logger
  private logger: Logger = LoggerManager.create('StatsPieChartComponent');

  public get pieChartOptions(): any {
    return {
      responsive: true,
      plugins: {
        title: {
          display: () => this.showTitle,
          align: 'center',
          text: () => this.titleText,
          position: 'bottom',
          font: { weight: 'bold', size: 10 },
        },
        legend: {
          display: false,
          labels: {
            color: '#495057',
          },
        },
        tooltip: {
          enabled: true,
          position: 'nearest',
          bodyFont: { weight: 'bold', size: 13 },
          footerFont: { weight: 'normal', size: 11 },
          footerColor: 'lightgray',
          footerAlign: 'right',
          backgroundColor: 'rgba(6, 55, 55, 0.9)',
          callbacks: {
            label: (context: any) => {
              let label = context.label[0] || 'Unknown';
              if (label) {
                label += ': ' + context.formattedValue;
              }
              return ` ${label}`;
            },
            footer: (item: any, data: any) => {
              return 'click to see more';
            },
          },
        },
      },
    };
  }

  constructor(private cdr: ChangeDetectorRef, private zone: NgZone) {}

  ngOnInit(): void {}

  @Input()
  set stats(stats: AbstractStats) {
    this._stats = stats;
    this.pieChartData = {
      labels: this.getLabels(),
      datasets: [
        {
          data: this.data,
          backgroundColor: this.getColors(),
        },
      ],
    };
  }

  get stats(): AbstractStats {
    return this._stats;
  }

  ngOnChanges(changes: SimpleChanges): void {}

  ngAfterViewInit() {
    this.logger.debug('after view init ' + this.stats);
  }

  public update() {
    this.zone.runOutsideAngular(() => {
      if (this.stats) {
        this.pieChartData = [
          {
            data: this.data,
            backgroundColor: this.getColors(),
          },
        ];
        // this.cdr.detectChanges();
        this.logger.debug(
          'workflow pie data',
          this.pieChartData,
          this.pieChartLabels,
          this.stats
        );
      }
    });
  }

  public getColors() {
    return this.stats instanceof AggregatedStatusStats
      ? ['#1f8787', '#f9b233', '#dc3545', 'grey']
      : this.stats instanceof InstanceStats
      ? [
          '#1f8787',
          '#dc3545',
          '#ffc107',
          '#6c757d',
          '#17a2b8',
          '#fd7e14',
          'grey',
        ]
      : ['#D5D8DC'];
  }

  public getLabels() {
    return this.stats instanceof AggregatedStatusStats
      ? [['Passing'], ['Some passing'], ['Failing'], ['Unavailable']]
      : this.stats instanceof InstanceStats
      ? [
          ['Passed'],
          ['Failed'],
          ['Error'],
          ['Aborted'],
          ['Running'],
          ['Waiting'],
          ['Unavailable'],
        ]
      : [['Unknown']];
  }

  public get data(): Array<number> {
    let data: Array<number> = [];
    if (this.stats) {
      for (let p of this.stats.statuses) {
        let v: number = this.stats[p].length;
        data.push(v);
      }
    } else {
      data.push(1);
    }
    this.logger.debug('Data', data, this.stats);
    return data;
  }
}
