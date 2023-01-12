import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { Logger, LoggerManager } from 'src/app/utils/logging';

@Component({
  selector: 'item-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
})
export class SearchBarComponent implements OnInit {
  _actualFilterValue: string;
  _sortingOrder: string = 'desc';
  _searchAllValues: boolean = false;

  @Input() showAllButtonName: string;
  @Input() browseButton: boolean = true;
  @Input() elementType: string;
  @Input() filterValue: string;
  @Input() sortingOrder: string;
  @Output() filterValueChange = new EventEmitter<string>();
  @Output() sortingOrderChange = new EventEmitter<string>();
  @ViewChild('searchInputText') searchInputText: ElementRef;

  // initialize logger
  private logger: Logger = LoggerManager.create('SearchBarComponent');

  constructor() { }

  ngOnInit(): void { }

  ngAfterViewInit() {
    fromEvent(this.searchInputText.nativeElement, 'input')
      .pipe(map((event: Event) => (event.target as HTMLInputElement).value))
      .pipe(debounceTime(800))
      .pipe(distinctUntilChanged())
      .subscribe(data => {
        this.emitValue(data);
        this.logger.debug('Current filter value: ', this._actualFilterValue);
      });
  }

  public onKeyUpEnter() {
    this._searchAllValues = true;
    this.emitValue(this.actualFilterValue);
  }

  public set actualFilterValue(value: string) {
    this._actualFilterValue = value;
    if (value && value.length > 0)
      this._searchAllValues = false;
    this.logger.debug('Current filter value: ', this._actualFilterValue);
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

  private emitValue(value: string) {
    let valueToEmit = (this.actualFilterValue && this.actualFilterValue.length > 0)
      ? ("SEARCH_KEY###" + this.actualFilterValue) : "______ALL_____";
    this.filterValueChange.emit(valueToEmit);
    this.logger.debug('Current emitted value: ', valueToEmit);
  }

  public get searchAll(): boolean {
    return this._searchAllValues;
  }

  public reset() {
    if (this._searchAllValues === true
      || this._actualFilterValue && this._actualFilterValue.length > 0) {
      this._actualFilterValue = null;
      this._searchAllValues = false;
      this.filterValueChange.emit(null);
    }
  }
}
