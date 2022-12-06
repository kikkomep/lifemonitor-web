import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';

// Import core state
import * as fromState from './state';
import * as fromWorkflow from './reducers/workflow.reducer';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    // register core store
    StoreModule.forFeature(fromState.stateFeatureKey, fromState.reducers, {
      metaReducers: fromState.metaReducers,
    }),
  ],
  providers: [],
  exports: [],
})
export class CoreModule {}
