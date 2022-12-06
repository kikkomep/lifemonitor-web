import { isDevMode } from '@angular/core';
import {
  ActionReducer,
  ActionReducerMap,
  createFeatureSelector,
  createSelector,
  MetaReducer,
} from '@ngrx/store';
import { reducer as workflowsReducers } from './reducers/workflow.reducer';

export const stateFeatureKey = 'state';

export interface State {
  workflowState: State;
}

export const reducers: ActionReducerMap<State> = {};

export const metaReducers: MetaReducer<State>[] = isDevMode() ? [] : [];
