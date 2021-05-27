import { Component, OnInit } from '@angular/core';

import { AuthService } from 'src/app/utils/services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  constructor(public appService: AuthService) {}

  ngOnInit() {}
}
