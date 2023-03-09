import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { AuthService } from 'src/app/utils/services/auth.service';
import { UserDropdownMenuComponent } from './user-dropdown-menu/user-dropdown-menu.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  @ViewChild('userDropdownMenu') dropdownMenu: UserDropdownMenuComponent;
  @Output() toggleMenuSidebar: EventEmitter<any> = new EventEmitter<any>();

  public searchForm: FormGroup;

  constructor(private appService: AuthService) {}

  ngOnInit() {
    this.searchForm = new FormGroup({
      search: new FormControl(null),
    });
  }

  public get isUserLogged(): boolean {
    return this.appService.isUserLogged();
  }

  public openUserProfile() {
    this.dropdownMenu.openProfile();
  }

  public logout() {
    this.appService.logout().then(() => {});
  }
}
