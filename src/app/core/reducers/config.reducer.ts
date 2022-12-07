import { Action, createReducer, on } from '@ngrx/store';
import { Config } from '../models/config.model';

import * as ConfigActions from '../actions/config.actions';
import { Logger, LoggerManager } from '../utils/logging';

// initialize logger
const logger: Logger = LoggerManager.getLogger('ConfigService');

// feature name
export const featureKey = 'config';

export interface State {
  // additional entities state properties
  config?: Config;
  loading: boolean;
}

export const initialState: State = {
  loading: false,
};

export const reducer = createReducer(
  initialState,
  on(ConfigActions.loadConfiguration, (state) => {
    return {
      ...state,
      loading: true,
    };
  }),
  on(ConfigActions.configurationLoadingSuccess, (state, { config }) => {
    logger.debug('OK: ', state, config);
    return {
      loading: false,
      config: { ...config },
    };
  })
);
