import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Observable, of } from 'rxjs';
import { initialState, State } from '../reducers/config.reducer';
import { ConfigService } from '../services/config/config.service';
import { ConfigEffects } from './config.effects';
import { provideMockActions } from '@ngrx/effects/testing';
import { HttpClientModule } from '@angular/common/http';

import * as ConfigActions from '../actions/config.actions';
import { Config } from '../models/config.model';

const fakeConfig: Config = {
  production: false,
  apiBaseUrl: '',
  clientId: '',
  configFile: '',
};

describe('ConfigEffects', () => {
  let actions$: Observable<any>;
  let effects: ConfigEffects;
  let store: MockStore<State>;
  let configService: ConfigService = jasmine.createSpyObj('configService', {
    getConfig: null,
    loadConfig: of(fakeConfig),
  });
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [
        ConfigEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState }),
        { provide: ConfigService, useValue: configService },
      ],
    });
    effects = TestBed.inject(ConfigEffects);
    store = TestBed.inject(MockStore);
  });

  it('should load the right config', (done: DoneFn) => {
    console.log('Config service:', configService);
    expect(effects.loadConfig$).toBeDefined();
    actions$ = of(ConfigActions.loadConfiguration);
    effects.loadConfig$.subscribe((res) => {
      console.debug('Actual fffect for Config.loadConfiguration', res);
      expect(configService.loadConfig).toHaveBeenCalledTimes(1);
      expect(res).toEqual(
        ConfigActions.configurationLoadingSuccess({ config: fakeConfig })
      );
      done();
    });
  });
});
