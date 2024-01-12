/*
Copyright (c) 2020-2024 CRS4

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

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
