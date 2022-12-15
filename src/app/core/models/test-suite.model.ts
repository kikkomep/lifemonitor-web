import { TestInstance } from './test-instance.model';

export interface TestSuite {
  uuid: string;
  roc_suite: string;
  workflow_version_uuid: string;
  name: string;
  definition?: TestDefinition;
  instances?: TestInstance[];
}

export interface TestDefinition {
  definition: string;
  test_engine: TestEngine;
}

export interface TestEngine {
  type: string;
  version: string;
}
