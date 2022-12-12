import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY } from 'rxjs';
import {
  map,
  mergeMap,
  catchError,
  delay,
  switchMap,
  tap,
} from 'rxjs/operators';
import * as WorkflowsActions from '../actions/workflow.actions';
import { Workflow } from '../models/workflow.model';

import { LifeMonitorApiService } from '../services/lifemonitor/lifemonitor-api.service';

@Injectable()
export class WorkflowEffects {
  loadPublicWorkflows$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkflowsActions.loadPublicWorkflows),
      mergeMap(() =>
        this.apiService.getPublicWorkflows().pipe(
          delay(2000),
          map((data) =>
            WorkflowsActions.loadingPublicWorkflowsSuccess({
              workflows: data as Workflow[],
            })
          ),
          catchError(() => EMPTY)
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private apiService: LifeMonitorApiService
  ) {
    console.log(actions$, apiService);
  }
}
