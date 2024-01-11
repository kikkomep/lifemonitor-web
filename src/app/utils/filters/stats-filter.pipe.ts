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
import {
  AggregatedStatusStatsItem,
  AggregatedStatusStats,
} from 'src/app/models/stats.model';
import { Logger, LoggerManager } from '../logging';

@Pipe({
  name: 'statsFilterPipe',
})
export class StatsFilterPipe implements PipeTransform {

  // initialize logger
  private logger: Logger = LoggerManager.create('StatsFilterPipe');

  transform(
    value: AggregatedStatusStats,
    input: string,
    cryteria: string[] = undefined
  ): AggregatedStatusStats {
    this.logger.debug('Filter Input: ', input, value);
    if (!input || input === "______ALL_____") return value;
    let data = value.all;
    let filteredItems: AggregatedStatusStatsItem[] = (data.filter(
      (val) =>
        ((!cryteria || 'name' in cryteria) &&
          val.name.toLowerCase().indexOf(input.toLowerCase()) >= 0) ||
        ((!cryteria || 'uuid' in cryteria) &&
          val.uuid.toLowerCase().indexOf(input.toLowerCase()) >= 0)
    ) as unknown) as AggregatedStatusStatsItem[];
    return new AggregatedStatusStats(filteredItems);
  }
}
