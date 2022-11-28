import { Pipe, PipeTransform } from '@angular/core';
import { Logger, LoggerManager } from '../logging';

@Pipe({
  name: 'arraySizeFilterPipe',
})
export class ArraySizeFilterPipe implements PipeTransform {

  // initialize logger
  private logger: Logger = LoggerManager.create('ArraySizeFilterPipe');

  transform(
    value: [],
    size: number
  ): any[] {
    this.logger.debug('Filter Input: ', value, size);
    if (!value) return value;
    let result = [];
    while (result.length < (size - value.length)) {
      result.push({});
    }
    for (let item of value) {
      result.push(item);
      if (result.length == size) break;
    }
    return result;
  }
}
