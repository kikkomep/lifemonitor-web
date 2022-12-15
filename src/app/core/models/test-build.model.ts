import { TestStatus } from './status.model';

export interface TestBuild {
  build_id: string;
  suite_uuid: string;
  status: TestStatus;
  timestamp: number;
  duration: number;
  links: { [key: string]: string };
}
