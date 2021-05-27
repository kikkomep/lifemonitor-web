import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { AuthService } from 'src/app/utils/services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  @Output() toggleMenuSidebar: EventEmitter<any> = new EventEmitter<any>();
  public searchForm: FormGroup;

  constructor(private appService: AuthService) {}

  ngOnInit() {
    this.searchForm = new FormGroup({
      search: new FormControl(null),
    });
  }

  logout() {
    this.appService.logout();
  }
}
