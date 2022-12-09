import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';

// Import core state
import { HttpClientModule } from '@angular/common/http';
import { EffectsModule } from '@ngrx/effects';
import { ConfigEffects } from './effects/config.effects';
import { WorkflowEffects } from './effects/workflow.effects';

// Import feature state reducers
import * as fromConfig from './reducers/config.reducer';
import * as fromWorkflow from './reducers/workflow.reducer';

// Import global state
import * as fromState from './state';

@NgModule({
  declarations: [],
  imports: [
    // core Angular modules
    CommonModule,
    HttpClientModule,
    // Register feature effects
    EffectsModule.forFeature([ConfigEffects, WorkflowEffects]),
    // Register feature stores
    StoreModule.forFeature(fromConfig.featureKey, fromConfig.reducer),
    // Register main feature store
    StoreModule.forFeature(fromState.stateFeatureKey, fromState.reducers, {
      metaReducers: fromState.metaReducers,
    }),
  ],
  providers: [],
  exports: [],
})
export class CoreModule {}
