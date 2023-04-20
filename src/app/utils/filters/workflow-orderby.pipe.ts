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
      console.debug('Checking ', previous, current);
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
