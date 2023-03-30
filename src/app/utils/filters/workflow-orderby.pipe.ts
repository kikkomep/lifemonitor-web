import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'workflowOrderBy',
})
export class WorkflowOrderByPipe implements PipeTransform {
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
      const aValue = this.getLatestModified(a.workflow.versions, property);
      const bValue = this.getLatestModified(b.workflow.versions, property);
      return this.compare(aValue, bValue, direction);
    });

    return sortedArray;
  }

  getLatestModified(versions: any[], property: string): number {
    if (!Array.isArray(versions) || versions.length === 0) {
      return 0;
    }
    const latestVersion = versions.reduce((previous, current) => {
      console.debug('Checking ', previous, current);
      const a = previous[property] || 0;
      const b = current[property] || 0;
      return this.compare(a, b, 'desc');
    });
    return latestVersion.modified;
  }

  compare(aValue: any, bValue: any, direction: string = 'asc'): number {
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return (aValue - bValue) * (direction === 'asc' ? 1 : -1);
    } else {
      const comparison = aValue.localeCompare(bValue);
      const result = comparison * (direction === 'asc' ? 1 : -1);
      return result;
    }
  }
}
