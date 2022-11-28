import { Model } from './base.models';

export class Registry extends Model {
  uuid: string;
  name: string;
  type: string;
  uri: string;
}

export class RegistryWorkflow extends Model {
  identifier: string;
  name: string;
  latest_version: string;
  versions: [];
  links: object;
  registry: Registry;
}
