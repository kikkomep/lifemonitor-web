import { TestingService } from './testing-service.model';

export interface TestInstance {
  uuid: string;
  suite_uuid: string;
  name: string;
  roc_instance: string;
  testing_service: TestingService;
  resource: string;
  managed: boolean;
  links: { [key: string]: string };
}
