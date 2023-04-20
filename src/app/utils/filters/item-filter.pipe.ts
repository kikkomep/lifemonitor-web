import { Pipe, PipeTransform } from '@angular/core';
import { AggregatedStatusStatsItem, StatsItem } from 'src/app/models/stats.model';
import { Logger, LoggerManager } from '../logging';

@Pipe({
  name: 'itemFilterPipe',
})
export class ItemFilterPipe implements PipeTransform {

  // initialize logger
  private logger: Logger = LoggerManager.create('ItemFilterPipe');

  transform(
    value: StatsItem[],
    input: string,
    cryteria: string[] = undefined
  ): StatsItem[] {
    this.logger.debug('Filter Input: ', input, value);
    if (!input || input === "______ALL_____") return value;
    let data = value;
    return data.filter(
      (val) => ((!cryteria || 'name' in cryteria) &&
        val.name.toLowerCase().indexOf(input.toLowerCase()) >= 0) ||
        ((!cryteria || 'uuid' in cryteria) &&
          val.uuid.toLowerCase().indexOf(input.toLowerCase()) >= 0)
    ) as unknown as AggregatedStatusStatsItem[];
  }
}
