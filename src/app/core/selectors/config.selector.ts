import { createFeatureSelector, createSelector } from '@ngrx/store';
import { config } from 'rxjs';
import { Config } from '../models/config.model';

import { featureKey, State } from '../reducers/config.reducer';

export const selectFeature = createFeatureSelector<State>(featureKey);

export const isLoading = createSelector(selectFeature, (state: State) => {
  return state.loading;
});

// export const selectCollectionState =
//   createFeatureSelector<ReadonlyArray<string>>('collection');

// export const selectBookCollection = createSelector(
//   selectBooks,
//   selectCollectionState,
//   (books, collection) => {
//     return collection.map((id) => books.find((book) => book.id === id));
//   }
// );
