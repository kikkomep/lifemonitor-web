import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY } from 'rxjs';
import {
  catchError,
  delay, map,
  mergeMap, switchMap,
  tap
} from 'rxjs/operators';
import {
  configurationLoadingSuccess,
  loadConfiguration
} from '../actions/config.actions';
import { Config } from '../models/config.model';
import { ConfigService } from '../services/config/config.service';
import { LifeMonitorApiService } from '../services/lifemonitor/lifemonitor-api.service';

@Injectable()
export class ConfigEffects {
  loadConfig$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadConfiguration),
      mergeMap(() =>
        this.configService.loadConfig().pipe(
          delay(2000),
          map((data) => {
            const config: Config = data;
            this.lifeMonitorApiService.initialize(
              config.apiBaseUrl,
              config.apiKey
            );
            return configurationLoadingSuccess({ config: config });
          }),
          catchError(() => EMPTY)
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private configService: ConfigService,
    private lifeMonitorApiService: LifeMonitorApiService
  ) {
    console.log(actions$, configService, lifeMonitorApiService);
  }
}
