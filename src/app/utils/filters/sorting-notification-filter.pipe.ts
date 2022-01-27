import { Pipe, PipeTransform } from '@angular/core';
import { UserNotification } from 'src/app/models/notification.model';

@Pipe({
  name: 'sortingNotificationFilter',
})
export class SortingNotificationFilterPipe implements PipeTransform {
  transform(value: UserNotification[], order: string = 'asc'): UserNotification[] {
    console.log('Sorting Input: ', order);
    return value.sort(
      (a, b) =>
      (
        (a.created >= b.created || !a.read && b.read ? 1 : -1)
        * (order === 'asc' ? 1 : -1)
      )
    );
  }
}
