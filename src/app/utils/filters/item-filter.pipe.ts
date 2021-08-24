import { Pipe, PipeTransform } from '@angular/core';
import { AggregatedStatusStatsItem, StatsItem } from 'src/app/models/stats.model';

@Pipe({
  name: 'itemFilterPipe',
})
export class ItemFilterPipe implements PipeTransform {
  transform(
    value: StatsItem[],
    input: string,
    cryteria: string[] = undefined
  ): StatsItem[] {
    console.log('Filter Input: ', input);
    if (input) {
      let data = value;
      return data.filter(
        (val) => ((!cryteria || 'name' in cryteria) &&
          val.name.toLowerCase().indexOf(input.toLowerCase()) >= 0) ||
          ((!cryteria || 'uuid' in cryteria) &&
            val.uuid.toLowerCase().indexOf(input.toLowerCase()) >= 0)
      ) as unknown as AggregatedStatusStatsItem[];
    } else {
      return value;
    }
  }
}
