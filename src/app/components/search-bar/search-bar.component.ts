import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'item-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
})
export class SearchBarComponent implements OnInit {
  _actualFilterValue: string;
  _sortingOrder: string = 'desc';

  @Input() filterValue: string;
  @Input() sortingOrder: string;
  @Output() filterValueChange = new EventEmitter<string>();
  @Output() sortingOrderChange = new EventEmitter<string>();

  constructor() {}

  ngOnInit(): void {}

  public set actualFilterValue(value: string) {
    this._actualFilterValue = value;
    console.log('Current filter value: ', this._actualFilterValue);
    this.filterValueChange.emit(value);
    console.log('Current filter value: ', this._actualFilterValue);
  }

  public get actualFilterValue(): string {
    return this._actualFilterValue;
  }

  public get actualSortingOrder(): string {
    return this._sortingOrder;
  }

  public changeSortingOrder() {
    this._sortingOrder = this._sortingOrder === 'asc' ? 'desc' : 'asc';
    this.sortingOrderChange.emit(this._sortingOrder);
  }

  public reset() {
    if (this._actualFilterValue && this._actualFilterValue.length > 0) {
      this._actualFilterValue = null;
      this.filterValueChange.emit(null);
    }
  }
}
