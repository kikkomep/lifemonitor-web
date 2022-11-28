import { Pipe, PipeTransform } from '@angular/core';
import { UserNotification } from 'src/app/models/notification.model';
import { Logger, LoggerManager } from '../logging';

@Pipe({
  name: 'sortingNotificationFilter',
})
export class SortingNotificationFilterPipe implements PipeTransform {

  // initialize logger
  private logger: Logger = LoggerManager.create('SortingNotificationFilterPipe');

  transform(value: UserNotification[], order: string = 'asc'): UserNotification[] {
    this.logger.debug('Sorting Input: ', order);
    return value.sort(
      (a, b) =>
      (
        (a.created >= b.created || !a.read && b.read ? 1 : -1)
        * (order === 'asc' ? 1 : -1)
      )
    );
  }
}
