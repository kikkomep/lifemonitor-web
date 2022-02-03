import {
  ChangeDetectorRef, Component,
  Input, OnChanges, OnInit, SimpleChanges
} from '@angular/core';
import { ChartDataSets, ChartOptions, ChartType } from 'chart.js';
import { Label } from 'ng2-charts';
import {
  AbstractStats,
  AggregatedStatusStats,
  InstanceStats
} from 'src/app/models/stats.model';
import { Logger, LoggerManager } from 'src/app/utils/logging';

@Component({
  selector: 'stats-pie-chart',
  templateUrl: './stats-pie-chart.component.html',
  styleUrls: ['./stats-pie-chart.component.scss'],
})
export class StatsPieChartComponent implements OnInit, OnChanges {
  @Input() stats!: AbstractStats;

  // initialize logger
  private logger: Logger = LoggerManager.create('StatsPieChartComponent');


  public pieChartOptions: ChartOptions = {
    responsive: true,
    cutoutPercentage: 15,
    // circumference: 10,
    tooltips: {
      mode: 'label',
      enabled: true,
      footerFontSize: 9,
      footerFontColor: 'lightgray',
      footerAlign: 'right',
      callbacks: {
        // title: (tooltipItem, data) => {
        //   return 'Test Instances ';
        // },
        label: function (tooltipItem, data) {
          var indice = tooltipItem.index;
          return (
            ' ' +
            data.labels[indice] +
            ': ' +
            data.datasets[0].data[indice] +
            ''
          );
        },
        footer: (item, data) => {
          return 'click to see more';
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
      position: 'right',
    },
  };
  public pieChartLabels: Label[] = [];

  public pieChartData: ChartDataSets[];
  public pieChartType: ChartType = 'pie';
  public pieChartLegend = false;
  public pieChartPlugins = [];

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit(): void { }

  ngOnChanges(changes: SimpleChanges): void {
    this.update();
  }

  ngAfterViewInit() {
    this.logger.debug('after view init ' + this.stats);
  }

  public update() {
    if (this.stats) {
      this.pieChartLabels = this.getLabels();
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
  }

  public getColors() {
    return this.stats instanceof AggregatedStatusStats
      ? ['#1f8787', '#f9b233', '#dc3545', 'grey']
      : this.stats instanceof InstanceStats
        ? ['#1f8787', '#dc3545', '#ffc107', '#6c757d', '#17a2b8', '#fd7e14', 'grey']
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
    this.logger.debug('Data', data);
    return data;
  }
}
