import { keys } from 'ts-transformer-keys';
import { AggregatedTestStatus } from './status.model';
import { TestBuild } from './test-build.model';

export interface Workflow {
  uuid: string;
  name: string;
  latest_version: string;
  public: boolean;
  versions?: WorkflowVersionItem[];
}

interface WorkflowVersionItem {
  uuid: string;
  version: string;
  is_latest: boolean;
  ro_crate_links: any;
}

export interface WorkflowVersionStatus {
  aggregated_test_status: AggregatedTestStatus;
  latest_builds?: TestBuild[];
  unavailability_reason?: string;
}

export type WorkflowStats = {
  [key in AggregatedTestStatus]: number;
};

export const deserialize = function (data: any): Workflow {
  const workflow = {};

  keys<Workflow>().forEach((key: string) => {
    return { key: data[key] };
  });
  return workflow as Workflow;
};
