import { Model } from './base.models';
import { Suite } from './suite.models';

export class UserNotification extends Model {
  id: string;
  data: object;
  created: number;
  read: number;
  uuid: string;
  title: string;
  body: string;
  icon: string;
  lang: string;
  tag: string;
  event: string;

  constructor(rawData?: Object, skip?: []) {
    super(rawData, skip);
    this.updateIcon();
  }

  private updateIcon() {
    if (this.event === 'BUILD_FAILED') {
      this.icon = "fas fa-exclamation-circle";
    } else {
      this.icon = "fas fa-info-circle";
    }
  }

  public asUrlParam(): string {
    if (this.event === "BUILD_FAILED") {
      return Suite.getUrlParam(
        this.data["build"]["workflow"]["uuid"],
        this.data["build"]["suite"]["uuid"]);
    }
    return null;
  }
}
