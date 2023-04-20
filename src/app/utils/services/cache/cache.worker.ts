/// <reference lib="webworker" />

import { Logger, LoggerManager } from '../../logging';
import { CachedRequest, CachedResponse, CacheManager } from './cache-manager';

const cache = new CacheManager('api:lm');

const logger: Logger = LoggerManager.create('CacheWorker');

declare type WorkflowList = {
  [key: string]: {
    uuid: string;
    versions: Array<{
      uuid: string;
      version: string;
      is_latest: boolean;
    }>;
    latest_version: string;
    name: string;
  };
};

function onCacheEntriesGroupCreated(
  groupName: string,
  entries: {
    [key: string]: { request: CachedRequest; response: CachedResponse };
  }
) {
  const group = JSON.parse(groupName);
  logger.debug('Updated group', group);
  if (group['type'] === 'workflow') {
    postMessage({
      type: 'cacheEntriesGroupCreated',
      payload: {
        groupName: groupName,
        entries: {},
      },
    });
  }
}

cache.onCacheEntriesGroupCreated = (
  groupName: string,
  entries: {
    [key: string]: { request: CachedRequest; response: CachedResponse };
  }
) => onCacheEntriesGroupCreated(groupName, entries);

cache.onCacheEntriesGroupUpdated = (
  groupName: string,
  entries: {
    [key: string]: { request: CachedRequest; response: CachedResponse };
  }
) => {
  const group = JSON.parse(groupName);
  logger.debug('Updated group', group);
  if (group['type'] === 'workflow') {
    postMessage({
      type: 'cacheEntriesGroupUpdated',
      payload: {
        groupName: groupName,
        entries: {},
      },
    });
  }
};

cache.onCacheEntriesGroupDeleted = (
  groupName: string,
  entries: Array<string>
) => {
  logger.debug(`Deleted cache group ${groupName}`);
  postMessage({
    type: 'cacheEntriesGroupDeleted',
    payload: {
      groupName: groupName,
      entries: {},
    },
  });
};

function onPing(data) {
  cache.getEntries().then((data) => {
    postMessage({
      type: 'echo',
      data: data.groups,
    });
  });
}

async function getCachedEntryData<T>(
  entry: { request: CachedRequest; response: CachedResponse },
  outdated: number
): Promise<T> {
  let result: any = null;
  const r: CachedRequest = entry.request;
  logger.debug('getCachedRequest: START');
  logger.debug('getCachedRequest: threshold time?', outdated, r.cacheCreatedAt);
  const isOutdated: boolean = r.cacheCreatedAt < outdated;
  logger.debug(`Request outdated: ${isOutdated}`, r.cacheCreatedAt, outdated);
  if (isOutdated) {
    logger.debug(`Request ${r.cacheEntry} outdated`);
    const refreshed = await cache.refreshEntryByKey(r.cacheEntry, {
      ignoreTTL: true,
    });
    logger.debug('Cached request refreshed');
    result = refreshed.response ? await refreshed.response.json() : null;
    logger.debug(`Refreshed request data of ${r.cacheEntry}:`, result);
  } else {
    logger.debug(`Request ${r.cacheEntry} not outdated`);
    result = await entry.response.clone().json();
  }
  logger.debug('getCachedRequest: DONE');
  return result as T;
}

declare type WorkflowItem = {
  name: string;
  uuid: string;
  latest_version: string;
  public: boolean;
  versions: Array<WorkflowVersionItem>;
};

declare type WorkflowVersionItem = {
  uuid: string;
  version: string;
  lastUpdate?: number;
  is_latest?: boolean;
};

declare type CachedWorkflowItemsMap = {
  [key: string]: WorkflowVersionItem;
};

function getCacheKey(data: { uuid: string; version?: string }): string {
  const toSerialize = {
    type: 'workflow',
    uuid: data.uuid,
  };
  if (data.version) toSerialize['version'] = data.version;
  const sKey = JSON.stringify(toSerialize);
  logger.debug('Serialized data key: ', toSerialize, sKey);
  return sKey;
}

function decodeCacheKey(
  key: string
): { type: string; uuid: string; version?: string } {
  return JSON.parse(key);
}

function mapToCachedEntry(
  data: WorkflowVersionItem,
  map?: CachedWorkflowItemsMap
): CachedWorkflowItemsMap {
  const result: CachedWorkflowItemsMap = map ?? {};
  result[
    JSON.stringify({
      type: 'workflow',
      uuid: data.uuid,
      version: data.version,
    })
  ] = data;
  return result;
}

function mapToCachedEntries(
  data: Array<WorkflowVersionItem>,
  map?: CachedWorkflowItemsMap
): CachedWorkflowItemsMap {
  const result: CachedWorkflowItemsMap = map ?? {};
  data.forEach((v) => {
    result[
      JSON.stringify({
        type: 'workflow',
        uuid: v.uuid,
        version: v.version,
      })
    ] = v;
  });
  return result;
}

function workflowListToMap(data: Array<any>): CachedWorkflowItemsMap {
  const result: CachedWorkflowItemsMap = {};
  data.forEach((v) => {
    result[v] = JSON.parse(v);
  });
  return result;
}

function workflowListItemsToMap(
  data: Array<WorkflowItem>,
  map?: CachedWorkflowItemsMap
): CachedWorkflowItemsMap {
  const result: CachedWorkflowItemsMap = map ?? {};
  data.forEach((w) => {
    mapToCachedEntries(w.versions, result);
  });
  return result;
}

async function requestReponseWorkflowListToMap(
  entry: {
    request: CachedRequest;
    response: CachedResponse;
  },
  outdated: number,
  map?: CachedWorkflowItemsMap
): Promise<CachedWorkflowItemsMap> {
  const result: CachedWorkflowItemsMap = map ?? {};
  const rawData = await getCachedEntryData<object>(entry, outdated);
  const items: WorkflowItem[] =
    rawData && 'items' in rawData ? (rawData['items'] as []) : null;
  if (items) workflowListItemsToMap(items, result);
  return result;
}

async function onSync(
  rawData: [{ uuid: string; version: string; lastUpdate: number }]
) {
  logger.info('New Synchronization started...');

  // map rawData into a structered set
  const workflowVersionsUdates: CachedWorkflowItemsMap = mapToCachedEntries(
    rawData.map((v) => ({
      ...v,
      lastUpdate: v.lastUpdate ? v.lastUpdate * 1000 : null,
    }))
  );
  logger.debug(
    `List of updated workflows: ${Object.keys(workflowVersionsUdates).length}`,
    workflowVersionsUdates
  );

  // compute the latest updated workflow
  const mostRecentUpdatedWorkflow = Object.values(
    workflowVersionsUdates
  ).reduce((prev, curr) => {
    return prev.lastUpdate > curr.lastUpdate ? prev : curr;
  });
  logger.debug('The most recent update: ', mostRecentUpdatedWorkflow);

  // load the current entries on the browser cache
  const cacheEntries = await cache.getEntries(null, true);
  logger.debug('Current Cache Entries: ', cacheEntries);

  // calculate the list of cached workflows
  const cachedWorkflows: CachedWorkflowItemsMap = workflowListToMap(
    Object.keys(cacheEntries.groups)
  );
  logger.debug(
    `Cached workflows: ${Object.keys(cachedWorkflows).length}`,
    cachedWorkflows
  );

  // find cached list of registered workflows
  // (list workflows of not authenticated users)
  const registeredWorkflows = cacheEntries.namedEntries['registeredWorkflows'];

  // find cached list of user workflows
  // (list workflows of authenticated users)
  const subscribedWorkflows = cacheEntries.namedEntries['subscribedWorkflows'];

  // compute list of workflows in user scope
  const availableWorkflows: CachedWorkflowItemsMap = {};
  if (registeredWorkflows) {
    logger.debug(
      'List of registered workflows',
      await registeredWorkflows.response.clone().json()
    );
    await requestReponseWorkflowListToMap(
      registeredWorkflows,
      mostRecentUpdatedWorkflow.lastUpdate,
      availableWorkflows
    );
  }
  if (subscribedWorkflows) {
    logger.debug(
      'List of subscribed workflows',
      await subscribedWorkflows.response.clone().json()
    );
    await requestReponseWorkflowListToMap(
      subscribedWorkflows,
      mostRecentUpdatedWorkflow.lastUpdate,
      availableWorkflows
    );
  }
  logger.debug(
    `List of available workflows: ${Object.keys(availableWorkflows).length}`,
    availableWorkflows
  );

  // by definition new workflows are those that are in the list of
  // available workflows but not cached at all
  // (i.e., no workflow version has been cached)
  Object.entries(workflowVersionsUdates).forEach(
    async ([key, value], index) => {
      if (!(key in cachedWorkflows)) {
        onCacheEntriesGroupCreated(getCacheKey(value), {});
      }
    }
  );

  // compute workflows to be refreshed
  Object.entries(workflowVersionsUdates).forEach(
    async ([key, value], index) => {
      logger.debug(
        `Checking ${key}, ${workflowVersionsUdates[key].lastUpdate} ${cacheEntries.createdAt[key]}`
      );
      if (key in cachedWorkflows) {
        const mAge =
          workflowVersionsUdates[key].lastUpdate - cacheEntries.createdAt[key];
        const outdated = mAge > 0;

        logger.debug(
          `Found ${key}, updated at ${
            workflowVersionsUdates[key].lastUpdate
          }=${new Date(
            workflowVersionsUdates[key].lastUpdate
          ).toLocaleString()}, ` +
            `cached at ${cacheEntries.createdAt[key]}=${new Date(
              cacheEntries.createdAt[key]
            ).toLocaleString()} outdated: ${outdated} (age: ${mAge} msecs)`
        );
        if (outdated) {
          logger.debug(`Outdated: ${key} (age: ${mAge} msecs)`);
          await cache.refreshCacheEntriesGroup(
            getCacheKey({ uuid: value.uuid }),
            false
          );
          await cache.refreshCacheEntriesGroup(key, true);
        } else {
          logger.debug(`Not outdated: ${key} (age: ${mAge} msecs)`);
        }
      }
    }
  );
}

async function onDelete(
  rawData: [{ uuid: string; version: string; lastUpdate: number }]
) {
  logger.info('Processing delete event...', rawData);
  for (const w of rawData) {
    const groupKey = getCacheKey(w);
    logger.debug(`Processing workflow version deletion (key: ${groupKey})`, w);
    await cache.deleteCacheEntriesGroup(groupKey);
  }
}

function isAsync(fn: Function): boolean {
  return fn.constructor.name === 'AsyncFunction';
}

addEventListener('message', ({ data }) => {
  const response = `worker response to ${data}`;
  logger.debug('Received message:', data);
  const message: { type: string; data: object } = data;

  const fnName: string =
    'on' + data['type'][0].toUpperCase() + data['type'].slice(1);
  logger.debug(
    `Candidate function name to handle message ${message.type}: ${fnName}`
  );
  try {
    const func: Function = eval(fnName);
    // logger.debug('Candidate function', func);
    func(message.data);
  } catch (ReferenceError) {
    logger.warn(`${fnName} is not a function`);
  }
});
