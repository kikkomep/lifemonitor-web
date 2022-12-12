import { Component } from '@angular/core';
import { Store } from '@ngrx/store';

import { isLoading } from 'src/app/core/selectors/config.selector';

@Component({
  selector: 'app-page-layout',
  templateUrl: './page-layout.component.html',
  styleUrls: ['./page-layout.component.scss'],
})
export class PageLayoutComponent {
  isLoading$ = this.store.select(isLoading);
  //workflows$ = this.store.select(loadWorkflows);

  constructor(private store: Store) {}
}
