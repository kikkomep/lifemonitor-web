import {
  configurationLoadingSuccess as configurationLoadingSuccessSuccess,
  loadConfiguration,
} from '../actions/config.actions';
import { Config } from '../models/config.model';
import { reducer, initialState, State } from '../reducers/config.reducer';

describe('Config Reducer', () => {
  // After initialization
  describe('onInit', () => {
    it('should return the previous state', () => {
      const action = {} as any;
      const result = reducer(initialState, action);
      expect(result).toBe(initialState);
    });
  });

  // LoadConfiguration action
  describe('onLoadConfiguration', () => {
    it("should set 'loading' property to true", () => {
      const result = reducer(initialState, loadConfiguration);
      const expected = {
        ...initialState,
        loading: true,
      };
      expect(result).toEqual(expected);
    });
  });

  // LoadConfiguration action
  describe('onConfigurationLoadingSuccess', () => {
    it("should set 'loading' property to false", () => {
      // set an empty configuration
      const config: Config = {
        production: false,
        apiBaseUrl: '',
        clientId: '',
        configFile: '',
      };
      const result = reducer(
        initialState,
        configurationLoadingSuccessSuccess({ config: config })
      );
      const expected = {
        loading: false,
        config: config,
      };
      expect(result).toEqual(expected);
    });
  });
});
