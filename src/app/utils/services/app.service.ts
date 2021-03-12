import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class AppService {
  public user = {
    firstName: 'FirstName',
    lastName: 'LastName',
    image: 'assets/img/user2-160x160.jpg',
  };

  private _userLogged = new Subject<boolean>();

  constructor() {}

  login() {
    localStorage.setItem('token', 'LOGGED_IN');
    this._userLogged.next(true);
  }

  register() {
    return this.login();
  }

  isUserLogged() {
    return localStorage.getItem('token') != null;
  }

  checkUserLogged(): Observable<boolean> {
    return this._userLogged.asObservable();
  }

  logout() {
    localStorage.removeItem('token');
    this._userLogged.next(false);
  }
}
