import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import * as WorkflowsActions from '../core/actions/workflow.actions';
import * as ConfigSelectors from '../core/selectors/config.selector';
import { Logger, LoggerManager } from '../core/utils/logging';

// initialize logger
const logger: Logger = LoggerManager.getLogger('ConfigService');
@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss'],
})
export class ViewComponent implements OnInit, OnDestroy {
  ready$: Observable<boolean>;
  private readSubscription: Subscription;

  constructor(private store: Store) {
    this.ready$ = this.store.select(ConfigSelectors.ready);
    this.readSubscription = this.ready$.subscribe((ready) => {
      if (ready) {
        logger.debug(`App ready: ${ready}`);
        this.store.dispatch(WorkflowsActions.loadPublicWorkflows());
      }
    });
  }
  ngOnInit() {}

  ngOnDestroy(): void {
    if (this.readSubscription) this.readSubscription.unsubscribe();
  }
}
