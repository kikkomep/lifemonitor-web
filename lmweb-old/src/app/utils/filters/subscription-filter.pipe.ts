import { Pipe, PipeTransform } from '@angular/core';
import { WorkflowVersion } from 'src/app/models/workflow.model';
import { Logger, LoggerManager } from '../logging';

@Pipe({
  name: 'subscriptionFilterPipe',
})
export class SubscriptionFilterPipe implements PipeTransform {

  // initialize logger
  private logger: Logger = LoggerManager.create('SubscriptionFilterPipe');

  transform(
    value: WorkflowVersion[]
  ): any[] {
    if (!value) return value;
    return value.filter(
      (v) => v.subscriptions && v.subscriptions.length > 0
    );
  }
}
