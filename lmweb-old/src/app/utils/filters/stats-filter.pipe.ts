import { Pipe, PipeTransform } from '@angular/core';
import {
  AggregatedStatusStatsItem,
  AggregatedStatusStats,
} from 'src/app/models/stats.model';
import { Logger, LoggerManager } from '../logging';

@Pipe({
  name: 'statsFilterPipe',
})
export class StatsFilterPipe implements PipeTransform {

  // initialize logger
  private logger: Logger = LoggerManager.create('StatsFilterPipe');

  transform(
    value: AggregatedStatusStats,
    input: string,
    cryteria: string[] = undefined
  ): AggregatedStatusStats {
    this.logger.debug('Filter Input: ', input, value);
    if (!input || input === "______ALL_____") return value;
    let data = value.all;
    let filteredItems: AggregatedStatusStatsItem[] = (data.filter(
      (val) =>
        ((!cryteria || 'name' in cryteria) &&
          val.name.toLowerCase().indexOf(input.toLowerCase()) >= 0) ||
        ((!cryteria || 'uuid' in cryteria) &&
          val.uuid.toLowerCase().indexOf(input.toLowerCase()) >= 0)
    ) as unknown) as AggregatedStatusStatsItem[];
    return new AggregatedStatusStats(filteredItems);
  }
}
