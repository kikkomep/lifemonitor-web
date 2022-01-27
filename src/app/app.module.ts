import { registerLocaleData } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import localeEn from '@angular/common/locales/en';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ChartsModule } from 'ng2-charts';
import { ToastrModule } from 'ngx-toastr';
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
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { FooterComponent } from './pages/main/footer/footer.component';
import { HeaderComponent } from './pages/main/header/header.component';
import { MessagesDropdownMenuComponent } from './pages/main/header/messages-dropdown-menu/messages-dropdown-menu.component';
import { NotificationsDropdownMenuComponent } from './pages/main/header/notifications-dropdown-menu/notifications-dropdown-menu.component';
import { UserDropdownMenuComponent } from './pages/main/header/user-dropdown-menu/user-dropdown-menu.component';
import { MainComponent } from './pages/main/main.component';
import { MenuSidebarComponent } from './pages/main/menu-sidebar/menu-sidebar.component';
import { RegisterComponent } from './pages/register/register.component';
import { ItemFilterPipe } from './utils/filters/item-filter.pipe';
import { SortingFilterPipe } from './utils/filters/sorting-filter.pipe';
import { SortingNotificationFilterPipe } from './utils/filters/sorting-notification-filter.pipe';
import { StatsFilterPipe } from './utils/filters/stats-filter.pipe';
import { HttpErrorInterceptor } from './utils/interceptors/http-error.interceptor';
import { AppConfigService } from './utils/services/config.service';
import { BlankComponent } from './views/blank/blank.component';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { SuiteComponent } from './views/suite/suite.component';
import { WorkflowComponent } from './views/workflow/workflow.component';



registerLocaleData(localeEn, 'en-EN');

export function initConfigService(appConfig: AppConfigService) {
  return (): Promise<any> => {
    return appConfig.loadConfig();
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
    RegisterComponent,
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
    StatsFilterPipe,
    ItemFilterPipe,
    SortingNotificationFilterPipe,
    SortingFilterPipe,
    SearchBarComponent,
    LoaderComponent,
    RocrateLogoComponent,
    WorkflowHeaderComponent,
    InputDialogComponent,
    WorkflowUploaderComponent,
  ],
  imports: [
    FormsModule,
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ToastrModule.forRoot({
      timeOut: 10000,
      positionClass: 'toast-bottom-right',
      preventDuplicates: true,
    }),
    ChartsModule,
    NgbModule,
  ],
  providers: [
    AppConfigService,
    {
      provide: APP_INITIALIZER,
      useFactory: initConfigService,
      deps: [AppConfigService],
      multi: true,
    },
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
