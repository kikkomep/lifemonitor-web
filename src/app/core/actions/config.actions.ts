import { createAction, props } from '@ngrx/store';

import { Config } from '../models/config.model';

export const loadConfiguration = createAction('[Config] Load configuration');

export const configurationLoadingSuccess = createAction(
  '[Config] Configuration loaded',
  props<{ config: Config }>()
);
