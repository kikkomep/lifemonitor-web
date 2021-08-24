import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { HomeComponent } from './pages/home/home.component';
import { AppComponent } from './app.component';
import { MainComponent } from './pages/main/main.component';
import { LoginComponent } from './pages/login/login.component';
import { HeaderComponent } from './pages/main/header/header.component';
import { FooterComponent } from './pages/main/footer/footer.component';
import { MenuSidebarComponent } from './pages/main/menu-sidebar/menu-sidebar.component';
import { BlankComponent } from './views/blank/blank.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { ToastrModule } from 'ngx-toastr';
import { MessagesDropdownMenuComponent } from './pages/main/header/messages-dropdown-menu/messages-dropdown-menu.component';
import { NotificationsDropdownMenuComponent } from './pages/main/header/notifications-dropdown-menu/notifications-dropdown-menu.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppButtonComponent } from './components/app-button/app-button.component';
import { HttpClientModule } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeEn from '@angular/common/locales/en';
import { ChartsModule } from 'ng2-charts';
import { UserDropdownMenuComponent } from './pages/main/header/user-dropdown-menu/user-dropdown-menu.component';
import { WorkflowComponent } from './views/workflow/workflow.component';
import { StatsPieChartComponent } from './components/stats-pie-chart/stats-pie-chart.component';
import { StatsBarChartComponent } from './components/stats-bar-chart/stats-bar-chart.component';
import { BuildComponent } from './views/build/build.component';
import { TestSuitesComponent } from './components/test-suites/test-suites.component';
import { SuiteComponent } from './views/suite/suite.component';
import { TestInstancesComponent } from './components/test-instances/test-instances.component';
import { ItemFilterPipe } from './utils/filters/item-filter.pipe';
import { SortingFilterPipe } from './utils/filters/sorting-filter.pipe';
import { SearchBarComponent } from './components/search-bar/search-bar.component';

registerLocaleData(localeEn, 'en-EN');

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
    BuildComponent,
    TestSuitesComponent,
    SuiteComponent,
    TestInstancesComponent,
    ItemFilterPipe,
    SortingFilterPipe,
    SearchBarComponent,
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
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
