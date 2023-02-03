/// <reference lib="webworker" />

import { Logger, LoggerManager } from '../../logging';
// import { AppConfigLoader } from '../config.loader';
import { CachedRequest, CachedResponse, CacheManager } from './cache-manager';

const cache = new CacheManager('api:lm');
// const configService = new AppConfigLoader();

// initialize logger
const logger: Logger = LoggerManager.create('CacheWorker');

let timer = null;

async function serializeEntriesGroup(
  groupName: string,
  entries: {
    [key: string]: { request: CachedRequest; response: CachedResponse };
  }
) {
  const result: { [key: string]: { request: string; response: object } } = {};
  for (const k in entries) {
    const entry = entries[k];
    result[k] = {
      request: entry.request.url,
      response: await entry.response.json(),
    };
  }
  return result;
}

cache.onCacheEntriesGroupCreated = (
  groupName: string,
  entries: {
    [key: string]: { request: CachedRequest; response: CachedResponse };
  }
) => {
  serializeEntriesGroup(groupName, entries).then((data) => {
    postMessage({
      type: 'cacheEntriesGroupCreated',
      payload: {
        groupName: groupName,
        entries: data,
      },
    });
  });
};

// setInterval(() => {
//   postMessage({
//     type: 'cacheEntriesGroupUpdated',
//     payload: {
//       groupName: JSON.stringify({
//         type: 'workflow',
//         uuid: 'a1f1c02e-d3b5-45bc-98ed-010b21012375',
//         version: 'latest',
//       }),
//       entries: {},
//     },
//   });
// }, 5000);

cache.onCacheEntriesGroupUpdated = (
  groupName: string,
  entries: {
    [key: string]: { request: CachedRequest; response: CachedResponse };
  }
) => {
  serializeEntriesGroup(groupName, entries).then((data) => {
    postMessage({
      type: 'cacheEntriesGroupUpdated',
      payload: {
        groupName: groupName,
        entries: data,
      },
    });
  });
};

cache.onCacheEntriesGroupDeleted = (
  groupName: string,
  entries: Array<string>
) => {
  postMessage({
    type: 'cacheEntriesGroupDeleted',
    payload: {
      groupName: groupName,
      entries: entries,
    },
  });
};

cache.onCacheEntryCreated = function (
  request: CachedRequest,
  response: CachedResponse
) {
  response.json().then((data) => {
    postMessage({
      type: 'cacheEntryCreated',
      payload: {
        request: request.url,
        cacheEntry: request.cacheEntry,
        cacheGroup: request.cacheGroup,
        cacheTTL: request.cacheTTL,
        cacheCreatedAt: request.cacheCreatedAt,
        data: data,
      },
    });
  });
};

cache.onCacheEntryUpdated = function (
  request: CachedRequest,
  response: CachedResponse
) {
  logger.log('Cache entry updated');
  response.json().then((data) => {
    postMessage({
      type: 'cacheEntryUpdated',
      payload: {
        request: request.url,
        cacheEntry: request.cacheEntry,
        cacheGroup: request.cacheGroup,
        cacheTTL: request.cacheTTL,
        cacheCreatedAt: request.cacheCreatedAt,
        data: data,
      },
    });
  });
};

cache.onCacheEntryDeleted = function (key: string) {
  postMessage({
    type: 'cacheEntryUpdated',
    payload: {
      request: key,
    },
  });
};

addEventListener('message', ({ data }) => {
  // const response = `worker response to ${data}`;
  logger.log('Worker has received message:', data);
  try {
    const message: WorkerMessage = data as WorkerMessage;
    if (message.type === 'start')
      start(message.payload as { interval: number });
    else if (message.type === 'stop') stop();
    else if (message.type === 'refresh') refresh();
  } catch (e) {
    logger.error(e);
  }
});

postMessage({ message: 'ok' });

function refresh() {
  try {
    const date = Date();
    logger.debug(`Refreshing data at ${date}...`);
    cache.refresh().then((data) => {
      logger.debug('Refreshed', data);
      logger.debug(`Refreshing data at ${date}... DONE`);
    });
  } catch (e) {
    logger.error(e);
  }
}

function start(options?: { interval: number }) {
  timer = setInterval(() => {
    try {
      const date = Date();
      logger.debug(`Refreshing data at ${date}...`);
      cache.refresh().then((data) => {
        logger.debug('Refreshed', data);
        logger.debug(`Refreshing data at ${date}... DONE`);
      });
    } catch (e) {
      logger.error(e);
    }
  }, options.interval);
}

function stop() {
  if (timer) {
    clearInterval(timer);
    logger.log('Stopped');
    timer = null;
  }
}
