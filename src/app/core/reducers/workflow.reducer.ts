import { Action, createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Workflow } from '../models/workflow.model';
import * as WorkflowActions from '../actions/workflow.actions';

export const workflowsFeatureKey = 'workflows';

export interface State extends EntityState<Workflow> {
  selectedWorkflow?: Workflow;
}

export const adapter: EntityAdapter<Workflow> = createEntityAdapter<Workflow>();

export const initialState: State = adapter.getInitialState({
  // additional entity state properties
});

export const reducer = createReducer(
  initialState,
  on(WorkflowActions.loadingPublicWorkflowsSuccess, (state, action) => {
    console.log('Reducing public workflows', action.workflows);
    return {
      ...state,
      publicWorkflows: action.workflows,
    };
  }),
  on(WorkflowActions.addWorkflow, (state, action) =>
    adapter.addOne(action.workflow, state)
  ),
  on(WorkflowActions.upsertWorkflow, (state, action) =>
    adapter.upsertOne(action.workflow, state)
  ),
  on(WorkflowActions.addWorkflows, (state, action) =>
    adapter.addMany(action.workflows, state)
  ),
  on(WorkflowActions.upsertWorkflows, (state, action) =>
    adapter.upsertMany(action.workflows, state)
  ),
  on(WorkflowActions.updateWorkflow, (state, action) =>
    adapter.updateOne(action.workflow, state)
  ),
  on(WorkflowActions.updateWorkflows, (state, action) =>
    adapter.updateMany(action.workflows, state)
  ),
  on(WorkflowActions.deleteWorkflow, (state, action) =>
    adapter.removeOne(action.id, state)
  ),
  on(WorkflowActions.deleteWorkflows, (state, action) =>
    adapter.removeMany(action.ids, state)
  ),
  on(WorkflowActions.loadWorkflows, (state, action) =>
    adapter.setAll(action.workflows, state)
  ),
  on(WorkflowActions.clearWorkflows, (state) => adapter.removeAll(state))
);
