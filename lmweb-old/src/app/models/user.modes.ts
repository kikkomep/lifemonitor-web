import { Model } from './base.models';

export class User extends Model {
  public id: string;
  public username: string;
  public picture: string;
  public identities: [];

  constructor(rawData?: Object, skip?: []) {
    super(rawData, skip);

    let info = rawData['identities']['lifemonitor'];
    this.picture = info['picture'] ? info['picture'] : '/assets/img/default-user-circle.png';
  }
}
