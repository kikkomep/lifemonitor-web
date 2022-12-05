// Angular modules
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// PrimNG modules
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { ChipsModule } from 'primeng/chips';
import { DockModule } from 'primeng/dock';
import { DropdownModule } from 'primeng/dropdown';
import { EditorModule } from 'primeng/editor';
import { ImageModule } from 'primeng/image';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { MessagesModule } from 'primeng/messages';
import { PanelModule } from 'primeng/panel';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectButtonModule } from 'primeng/selectbutton';
import { StepsModule } from 'primeng/steps';
import { TabViewModule } from 'primeng/tabview';
import { ToastModule } from 'primeng/toast';

// View Containers
import { PageLayoutComponent } from './containers/page-layout/page-layout.component';

// View Components

@NgModule({
  declarations: [PageLayoutComponent],
  imports: [
    // Common Angular dependencies
    CommonModule,
    // Angular modules
    FormsModule,
    // NG Prime Modules
    AvatarModule,
    AvatarGroupModule,
    BadgeModule,
    ButtonModule,
    CardModule,
    CheckboxModule,
    ChipsModule,
    DockModule,
    DropdownModule,
    EditorModule,
    ImageModule,
    InputTextModule,
    MessageModule,
    MessagesModule,
    PanelModule,
    ProgressSpinnerModule,
    SelectButtonModule,
    StepsModule,
    TabViewModule,
    ToastModule,
  ],
  exports: [PageLayoutComponent],
})
export class ViewModule {}
