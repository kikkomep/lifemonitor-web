import { createFeatureSelector, createSelector, State } from '@ngrx/store';

import {
  adapter,
  featureKey,
  State as WorkflowState,
} from '../reducers/workflow.reducer';

export const selectFeature = createFeatureSelector<WorkflowState>(featureKey);

export const { selectIds, selectEntities, selectAll, selectTotal } =
  adapter.getSelectors();

export const selectPublicWorkflows = createSelector(
  selectFeature,
  (state: WorkflowState) => {
    return state.publicWorkflows;
  }
);
