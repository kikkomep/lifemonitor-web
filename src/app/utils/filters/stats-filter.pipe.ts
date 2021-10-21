import { Pipe, PipeTransform } from '@angular/core';
import {
  AggregatedStatusStatsItem,
  AggregatedStatusStats,
} from 'src/app/models/stats.model';

@Pipe({
  name: 'statsFilterPipe',
})
export class StatsFilterPipe implements PipeTransform {
  transform(
    value: AggregatedStatusStats,
    input: string,
    cryteria: string[] = undefined
  ): AggregatedStatusStats {
    console.log('Filter Input: ', input);
    if (input) {
      let data = value.all;
      let filteredItems: AggregatedStatusStatsItem[] = (data.filter(
        (val) =>
          ((!cryteria || 'name' in cryteria) &&
            val.name.toLowerCase().indexOf(input.toLowerCase()) >= 0) ||
          ((!cryteria || 'uuid' in cryteria) &&
            val.uuid.toLowerCase().indexOf(input.toLowerCase()) >= 0)
      ) as unknown) as AggregatedStatusStatsItem[];
      return new AggregatedStatusStats(filteredItems);
    } else {
      return value;
    }
  }
}
