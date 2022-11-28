import { Pipe, PipeTransform } from '@angular/core';
import { StatsItem } from 'src/app/models/stats.model';
import { Logger, LoggerManager } from '../logging';

@Pipe({
  name: 'sortingFilter',
})
export class SortingFilterPipe implements PipeTransform {

  // initialize logger
  private logger: Logger = LoggerManager.create('SortingFilterPipe');

  transform(value: StatsItem[], order: string = 'asc'): StatsItem[] {
    this.logger.debug('Sorting Input: ', order);
    return value.sort(
      (a, b) =>
        (a.uuid.localeCompare(b.uuid) || a.name.localeCompare(b.name)) *
        (order === 'asc' ? 1 : -1)
    );
  }
}
