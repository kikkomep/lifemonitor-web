import { createFeatureSelector, createSelector } from '@ngrx/store';
import { config } from 'rxjs';
import { Config } from '../models/config.model';

import { featureKey, State } from '../reducers/config.reducer';

export const selectFeature = createFeatureSelector<State>(featureKey);

export const isLoading = createSelector(selectFeature, (state: State) => {
  return state.loading;
});

export const ready = createSelector(selectFeature, (state: State) => {
  return !state.loading && state.config !== null;
});
