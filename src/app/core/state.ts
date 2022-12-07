import { isDevMode } from '@angular/core';
import {
  ActionReducer,
  ActionReducerMap,
  createFeatureSelector,
  createSelector,
  MetaReducer,
} from '@ngrx/store';

// Import 'Config' state and reducer
import {
  reducer as configReducer,
  State as ConfigState,
} from './reducers/config.reducer';

// Import 'Workflows' state and reducer
import {
  reducer as workflowsReducer,
  State as WorkflowState,
} from './reducers/workflow.reducer';

export const stateFeatureKey = 'state';

export interface State {
  config: ConfigState;
  workflows: WorkflowState;
}

export const reducers: ActionReducerMap<State> = {
  config: configReducer,
  workflows: workflowsReducer,
};

export const metaReducers: MetaReducer<State>[] = isDevMode() ? [] : [];
