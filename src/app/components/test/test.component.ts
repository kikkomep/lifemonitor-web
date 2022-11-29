import { Component } from '@angular/core';
import { Message, MessageService } from 'primeng/api';

interface City {
  name: string;
  code: string;
}

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss'],
  providers: [MessageService],
})
export class TestComponent {
  text: string = '';
  text1: string =
    '<div>Hello World!</div><div>PrimeNG <b>Editor</b> Rocks</div><div><br></div>';

  selectedValues: string[] = ['val1', 'val2'];

  cities: City[];

  selectedCity!: City;

  msgs1: Message[];

  msgs2: Message[] = [];

  constructor(private messageService: MessageService) {
    this.cities = [
      { name: 'New York', code: 'NY' },
      { name: 'Rome', code: 'RM' },
      { name: 'London', code: 'LDN' },
      { name: 'Istanbul', code: 'IST' },
      { name: 'Paris', code: 'PRS' },
    ];

    this.msgs1 = [
      { severity: 'success', summary: 'Success', detail: 'Message Content' },
      { severity: 'info', summary: 'Info', detail: 'Message Content' },
      { severity: 'warn', summary: 'Warning', detail: 'Message Content' },
      { severity: 'error', summary: 'Error', detail: 'Message Content' },
      {
        severity: 'custom',
        summary: 'Custom',
        detail: 'Message Content',
        icon: 'pi-file',
      },
    ];
  }

  addMessages() {
    this.msgs2 = [
      { severity: 'success', summary: 'Success', detail: 'Message Content' },
      { severity: 'info', summary: 'Info', detail: 'Message Content' },
      { severity: 'warn', summary: 'Warning', detail: 'Message Content' },
      { severity: 'error', summary: 'Error', detail: 'Message Content' },
    ];
  }

  clearMessages() {
    this.msgs2 = [];
  }

  showViaService() {
    this.messageService.add({
      severity: 'success',
      summary: 'Service Message',
      detail: 'Via MessageService',
    });
  }

  addSingle() {
    this.messageService.add({
      severity: 'success',
      summary: 'Service Message',
      detail: 'Via MessageService',
    });
  }

  addMultiple() {
    this.messageService.addAll([
      {
        severity: 'success',
        summary: 'Service Message',
        detail: 'Via MessageService',
      },
      {
        severity: 'info',
        summary: 'Info Message',
        detail: 'Via MessageService',
      },
    ]);
  }

  clearToast() {
    this.messageService.clear();
  }

  chips: string[] = [];
  dockItems = [
    {
      label: 'Finder',
      icon: 'assets/showcase/images/dock/finder.svg',
    },
    {
      label: 'App Store',
      icon: 'assets/showcase/images/dock/appstore.svg',
    },
    {
      label: 'Photos',
      icon: 'assets/showcase/images/dock/photos.svg',
    },
    {
      label: 'Trash',
      icon: 'assets/showcase/images/dock/trash.png',
    },
  ];
}
