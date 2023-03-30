import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'orderBy',
})
export class OrderByPipe implements PipeTransform {
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
      const aValue = a[property];
      const bValue = b[property];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * (direction === 'asc' ? 1 : -1);
      } else {
        const comparison = aValue.localeCompare(bValue);
        return comparison * (direction === 'asc' ? 1 : -1);
      }
    });

    return sortedArray;
  }
}
