import { registerLocaleData } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import localeEn from '@angular/common/locales/en';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { SocketIoModule } from 'ngx-socket-io';

import { ToastrModule } from 'ngx-toastr';
import { environment } from 'src/environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AppButtonComponent } from './components/app-button/app-button.component';
import { InputDialogComponent } from './components/input-dialog/input-dialog.component';
import { LoaderComponent } from './components/loader/loader.component';
import { RocrateLogoComponent } from './components/rocrate-logo/rocrate-logo.component';
import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { StatsBarChartComponent } from './components/stats-bar-chart/stats-bar-chart.component';
import { StatsPieChartComponent } from './components/stats-pie-chart/stats-pie-chart.component';
import { TestInstancesComponent } from './components/test-instances/test-instances.component';
import { TestSuitesComponent } from './components/test-suites/test-suites.component';
import { WorkflowHeaderComponent } from './components/workflow-header/workflow-header.component';
import { WorkflowUploaderComponent } from './components/workflow-uploader/workflow-uploader.component';
import { WorkflowVersionSelectorComponent } from './components/workflow-version-selector/workflow-version-selector.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { FooterComponent } from './pages/main/footer/footer.component';
import { HeaderComponent } from './pages/main/header/header.component';
import { MessagesDropdownMenuComponent } from './pages/main/header/messages-dropdown-menu/messages-dropdown-menu.component';
import { NotificationsDropdownMenuComponent } from './pages/main/header/notifications-dropdown-menu/notifications-dropdown-menu.component';
import { UserDropdownMenuComponent } from './pages/main/header/user-dropdown-menu/user-dropdown-menu.component';
import { MainComponent } from './pages/main/main.component';
import { MenuSidebarComponent } from './pages/main/menu-sidebar/menu-sidebar.component';

import { ArraySizeFilterPipe } from './utils/filters/array-size-filter.pipe';

import { DataTablesModule } from 'angular-datatables';
import { BaseDataViewComponent } from './components/base-data-view/base-data-view.component';
import { ScrollComponent } from './components/scroll/scroll.component';
import { LogoutComponent } from './pages/logout/logout.component';
import { ItemFilterPipe } from './utils/filters/item-filter.pipe';
import { OrderByPipe } from './utils/filters/orderby.pipe';
import { SortingFilterPipe } from './utils/filters/sorting-filter.pipe';
import { SortingNotificationFilterPipe } from './utils/filters/sorting-notification-filter.pipe';
import { StatsFilterPipe } from './utils/filters/stats-filter.pipe';
import { TrimPipe } from './utils/filters/trim.pipe';
import { WorkflowOrderByPipe } from './utils/filters/workflow-orderby.pipe';
import { HttpErrorInterceptor } from './utils/interceptors/http-error.interceptor';
import { AppConfigService } from './utils/services/config.service';
import { BlankComponent } from './views/blank/blank.component';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { SuiteComponent } from './views/suite/suite.component';
import { WorkflowComponent } from './views/workflow/workflow.component';

// PrimeNG Modules
// import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { DataViewModule } from 'primeng/dataview';
import { DropdownModule } from 'primeng/dropdown';
import { PaginatorModule } from 'primeng/paginator';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TooltipModule } from 'primeng/tooltip';
import { cookieConfig as defaultCookieConfig } from './cookieConfig';

// Cookie Consent modules
import {
  NgcCookieConsentConfig,
  NgcCookieConsentModule,
} from 'ngx-cookieconsent';
import { map } from 'rxjs/operators';
import { LoggerManager } from './utils/logging';
import { ApiService } from './utils/services/api.service';
import { AuthService } from './utils/services/auth.service';
import { CachedHttpClientService } from './utils/services/cache/cachedhttpclient.service';

registerLocaleData(localeEn, 'en-EN');

export function initConfigService(
  appConfig: AppConfigService,
  cookieConfig: NgcCookieConsentConfig,
  cachedHttpClient: CachedHttpClientService,
  authService: AuthService,
  apiService: ApiService
) {
  const logger = LoggerManager.create('AppModuleInitializer');
  return (): Promise<any> => {
    return appConfig
      .loadConfig()
      .pipe(
        map(async (data: any) => {
          logger.info('Configuration loaded', data);
          Object.assign(cookieConfig, defaultCookieConfig);
          cookieConfig.cookie.domain = data.appDomain;
          cachedHttpClient.init();
          apiService.apiBaseUrl = data['apiBaseUrl'];
          authService.init().subscribe(
            (data) => {
              logger.info('User data fetched', data);
            },
            (err) => {
              logger.warn('Error fetching user data', err);
            }
          );
          return data;
        })
      )
      .toPromise();
  };
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    MainComponent,
    LoginComponent,
    HeaderComponent,
    FooterComponent,
    MenuSidebarComponent,
    BlankComponent,
    DashboardComponent,
    MessagesDropdownMenuComponent,
    NotificationsDropdownMenuComponent,
    AppButtonComponent,
    UserDropdownMenuComponent,
    WorkflowComponent,
    StatsPieChartComponent,
    StatsBarChartComponent,
    TestSuitesComponent,
    SuiteComponent,
    TestInstancesComponent,
    OrderByPipe,
    WorkflowOrderByPipe,
    StatsFilterPipe,
    ItemFilterPipe,
    SortingNotificationFilterPipe,
    ArraySizeFilterPipe,
    SortingFilterPipe,
    SearchBarComponent,
    TrimPipe,
    LoaderComponent,
    RocrateLogoComponent,
    WorkflowHeaderComponent,
    InputDialogComponent,
    WorkflowUploaderComponent,
    WorkflowVersionSelectorComponent,
    LogoutComponent,
    ScrollComponent,
    BaseDataViewComponent,
  ],
  imports: [
    // PrimeNg Modules
    // ChartModule,
    DropdownModule,
    DataViewModule,
    TableModule,
    ButtonModule,
    PaginatorModule,
    TooltipModule,
    ProgressBarModule,
    ToggleButtonModule,
    DataTablesModule,
    FormsModule,
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    ChartModule,
    HttpClientModule,
    ToastrModule.forRoot({
      timeOut: 10000,
      positionClass: 'toast-bottom-right',
      preventDuplicates: true,
    }),
    NgbModule,
    SocketIoModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000',
    }),
    // cookie consent
    NgcCookieConsentModule.forRoot(defaultCookieConfig),
  ],
  providers: [
    AppConfigService,
    {
      provide: APP_INITIALIZER,
      useFactory: initConfigService,
      deps: [
        AppConfigService,
        NgcCookieConsentModule,
        CachedHttpClientService,
        AuthService,
        ApiService,
      ],
      multi: true,
    },
    // ApiSocketService,
    {
      // interceptor for HTTP errors
      provide: HTTP_INTERCEPTORS,
      useClass: HttpErrorInterceptor,
      multi: true, // multiple interceptors are possible
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
