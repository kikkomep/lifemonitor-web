import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';

import * as fromWorkflow from './reducers/workflow.reducer';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    StoreModule.forFeature(
      fromWorkflow.workflowsFeatureKey,
      fromWorkflow.reducer
    ),
  ],
})
export class CoreModule {}
