// Angular dependencies
import { isDevMode, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';

// ngrx dependencies
import { EffectsModule } from '@ngrx/effects';
import { routerReducer, StoreRouterConnectingModule } from '@ngrx/router-store';
import { StoreModule } from '@ngrx/store';

// Apps components
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { ViewModule } from './view/view.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    // Set routes
    AppRoutingModule,
    // Common modules
    BrowserModule,
    BrowserAnimationsModule,
    // LifeMonitor core module
    CoreModule,
    // LifeMonitor view module
    ViewModule,
    // Register ngsw Service Worker
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000',
    }),
    // NgRx modules
    StoreModule.forRoot({ router: routerReducer }, {}),
    EffectsModule.forRoot([]),
    StoreRouterConnectingModule.forRoot(),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
