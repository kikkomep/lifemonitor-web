import { Pipe, PipeTransform } from '@angular/core';
import { StatsItem } from 'src/app/models/stats.model';

@Pipe({
  name: 'sortingFilter',
})
export class SortingFilterPipe implements PipeTransform {
  transform(value: StatsItem[], order: string = 'asc'): StatsItem[] {
    console.log('Sorting Input: ', order);
    return value.sort(
      (a, b) =>
        (a.uuid.localeCompare(b.uuid) || a.name.localeCompare(b.name)) *
        (order === 'asc' ? 1 : -1)
    );
  }
}
