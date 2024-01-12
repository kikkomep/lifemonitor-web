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
import { Workflow } from 'src/app/models/workflow.model';

@Pipe({
  name: 'workflowOrderBy',
})
export class WorkflowOrderByPipe implements PipeTransform {
  private LATEST_VERSION_KEY = '__latest_version__';

  transform(
    array: any[],
    property: string,
    direction: 'asc' | 'desc' = 'asc'
  ): any[] {
    if (!Array.isArray(array)) {
      return array;
    }

    if (!property || property.trim() === '') {
      return array;
    }

    const sortedArray = array.sort((a, b) => {
      const aValue = this.getLatestModified(a.workflow, property);
      const bValue = this.getLatestModified(b.workflow, property);
      return this.compare(aValue, bValue, direction);
    });

    return sortedArray;
  }

  getLatestModified(workflow: any, property: string): number {
    if (!workflow || !(workflow instanceof Workflow)) return 0;

    // Use the previously found latest version if it exists
    if (workflow[this.LATEST_VERSION_KEY])
      return workflow[this.LATEST_VERSION_KEY].modified;

    const versions: any[] = workflow.versions;
    if (!Array.isArray(versions) || versions.length === 0) {
      return 0;
    }
    const latestVersion = versions.reduce((previous, current) => {
      const a = previous[property] || 0;
      const b = current[property] || 0;
      return this.compare(a, b, 'desc');
    });
    workflow[this.LATEST_VERSION_KEY] = latestVersion;
    return latestVersion.modified;
  }

  compare(aValue: any, bValue: any, direction: string = 'asc'): number {
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return (aValue - bValue) * (direction === 'asc' ? 1 : -1);
    } else {
      const comparison = aValue ? aValue.localeCompare(bValue) : bValue;
      const result = comparison * (direction === 'asc' ? 1 : -1);
      return result;
    }
  }
}
