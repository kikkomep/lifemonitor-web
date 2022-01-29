import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

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
  @ViewChild('searchInputText') searchInputText: ElementRef;

  constructor() { }

  ngOnInit(): void { }

  ngAfterViewInit() {
    fromEvent(this.searchInputText.nativeElement, 'input')
      .pipe(map((event: Event) => (event.target as HTMLInputElement).value))
      .pipe(debounceTime(1500))
      .pipe(distinctUntilChanged())
      .subscribe(data => {
        this.filterValueChange.emit(data);
        console.log('Current filter value: ', this._actualFilterValue);
      });
  }

  public set actualFilterValue(value: string) {
    this._actualFilterValue = value;
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
