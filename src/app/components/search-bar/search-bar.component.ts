import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
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
  browseButtonEnabled: boolean = false;

  @Input() goBackButtonName: string;
  @Input() enableBrowseButton: string;
  @Input() searchButtonName: string = 'Search';
  @Input() allowEmptySearch: boolean = false;
  @Input() elementType: string;
  @Input() filterValue: string;
  @Input() sortingOrder: string;
  @Output() browseEnabled = new EventEmitter<boolean>();
  @Output() filterValueChange = new EventEmitter<string>();
  @Output() sortingOrderChange = new EventEmitter<string>();
  @ViewChild('searchInputText') searchInputText: ElementRef;
  @ViewChild('searchButton') searchButton: ElementRef;

  // initialize logger
  private logger: Logger = LoggerManager.create('SearchBarComponent');

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit() {
    fromEvent(this.searchInputText.nativeElement, 'input')
      .pipe(map((event: Event) => (event.target as HTMLInputElement).value))
      .pipe(debounceTime(800))
      .pipe(distinctUntilChanged())
      .subscribe((data) => {
        this.emitValue(data);
        this.logger.debug('Current filter value: ', this._actualFilterValue);
      });
  }

  public onKeyUpEnter() {
    if (!this.actualFilterValue && !this.allowEmptySearch) return;
    this._searchAllValues = true;
    this.emitValue(this.actualFilterValue);
  }

  public updateTooltips() {
    const title: string = !this.actualFilterValue
      ? 'Browse registered ' + this.elementType
      : 'Search ' + this.elementType + ' by UUID or name';
    // this.searchButton.nativeElement.setAttribute('data-original-title', title);
  }

  public onBrowseButtonClick($event) {
    this.browseButtonEnabled = !this.browseButtonEnabled;
    this.logger.debug('OnShowAllChange', $event, this.browseButtonEnabled);
    this.browseEnabled.emit(this.browseButtonEnabled);
    if (this.browseButtonEnabled) {
      this._searchAllValues = true;
      this.emitValue(this.actualFilterValue);
    } else {
      this.reset();
    }
  }

  public set actualFilterValue(value: string) {
    this._actualFilterValue = value;
    if (value && value.length > 0) this._searchAllValues = false;
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
    let valueToEmit =
      this.actualFilterValue && this.actualFilterValue.length > 0
        ? 'SEARCH_KEY###' + this.actualFilterValue
        : '______ALL_____';
    this.filterValueChange.emit(valueToEmit);
    this.updateTooltips();
    this.logger.debug('Current emitted value: ', valueToEmit);
  }

  public get searchAll(): boolean {
    return this._searchAllValues;
  }

  public reset() {
    if (
      this._searchAllValues === true ||
      (this._actualFilterValue && this._actualFilterValue.length > 0)
    ) {
      this._actualFilterValue = null;
      this._searchAllValues = false;
      this.filterValueChange.emit(null);
    }
    this.updateTooltips();
  }
}
