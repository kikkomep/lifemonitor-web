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
import {
  configurationLoadingSuccess,
  loadConfiguration,
} from '../actions/config.actions';
import { ConfigService } from '../services/config/config.service';

@Injectable()
export class ConfigEffects {
  loadConfig$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadConfiguration),
      mergeMap(() =>
        this.configService.loadConfig().pipe(
          delay(2000),
          map((data) => configurationLoadingSuccess({ config: data })),
          catchError(() => EMPTY)
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private configService: ConfigService
  ) {
    console.log(actions$, configService);
  }
}
