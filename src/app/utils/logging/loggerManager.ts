/*
Copyright (c) 2020-2024 CRS4

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import { Logger } from './logger';
import { Level } from './level';

export class LoggerManager {
  /**
   * Key used for the local storage settings
   */
  public static STORAGE_KEY = 'typescript-logger-state';
  /**
   * Mutes the log when created
   */
  public static MUTE_ON_CREATE = true;
  /**
   * Sets a fixed with for the module name. (0 if not set)
   */
  public static FIXED_WIDTH = 0;

  private static DEV_MODE = false;
  private static instances = {};
  private static instancesStateMap = {};
  private static levels: Level[] = [];

  private static initializationBlock = ((() => {
    if (self['window']) {
      const _window: any = self['window'];
      _window['LoggerManager'] = {
        onlyLevel: LoggerManager.onlyLevels,
        onlyModules: LoggerManager.onlyModules,
        mute: LoggerManager.mute,
        unmute: LoggerManager.unmute,
        unMuteAllModules: LoggerManager.unMuteAllModules,
        muteAllModules: LoggerManager.muteAllModules,
        showConfig: LoggerManager.showConfig,
      };
    }

    LoggerManager.loadState();
    return undefined;
  }) as () => undefined)();

  static create(name: string, color?: string): Logger {
    let logger: Logger;
    if (LoggerManager.instances[name] === undefined) {
      logger = new Logger(
        name,
        color || LoggerManager.getRandomColor(),
        LoggerManager.FIXED_WIDTH
      );
      LoggerManager.instances[name] = logger;
      LoggerManager.mute(name, LoggerManager.MUTE_ON_CREATE);
      this.saveState();
    } else {
      logger = LoggerManager.instances[name];
    }
    return logger;
  }

  static onlyLevels(...levels: Level[]) {
    LoggerManager.levels = levels;
    LoggerManager.saveState();
  }

  static onlyModules(...modules: string[]) {
    if (modules.length === 0) return;
    LoggerManager.muteAllModules();

    modules.forEach((m) => LoggerManager.mute(m, false));
  }

  static mute(moduleName: string, mute = true) {
    LoggerManager.instancesStateMap[moduleName] = mute;
    LoggerManager.saveState();
  }

  static unmute(moduleName: string) {
    LoggerManager.mute(moduleName, false);
  }

  static unMuteAllModules() {
    LoggerManager.MUTE_ON_CREATE = false;
    for (let moduleName in LoggerManager.instances) {
      LoggerManager.mute(moduleName, false);
    }
  }

  static muteAllModules() {
    LoggerManager.MUTE_ON_CREATE = true;
    for (let moduleName in LoggerManager.instances) {
      LoggerManager.mute(moduleName, true);
    }
  }

  static setProductionMode() {
    LoggerManager.DEV_MODE = false;
    LoggerManager.MUTE_ON_CREATE = true;
    const _window = self['window'];
    if (_window) {
      delete _window['LoggerManager'];
    }
  }

  static setDevelopmentMode() {
    LoggerManager.DEV_MODE = true;
    LoggerManager.MUTE_ON_CREATE = false;
    LoggerManager.unMuteAllModules();
    const _window = self['window'];
    if (_window) {
      delete _window['LoggerManager'];
    }
  }

  static isProductionMode(): boolean {
    return !LoggerManager.DEV_MODE;
  }

  private static isPresent(moduleName: string) {
    return LoggerManager.instancesStateMap.hasOwnProperty(moduleName);
  }

  static isMuted(moduleName: string) {
    return LoggerManager.instancesStateMap[moduleName];
  }

  static isLevelAllowed(level: Level) {
    return (
      LoggerManager.levels.length == 0 || LoggerManager.levels.includes(level)
    );
  }

  static showConfig() {
    return {
      modulesState: LoggerManager.instancesStateMap,
      levels: LoggerManager.levels,
    };
  }

  private static getRandomColor(): any {
    // Source https://www.paulirish.com/2009/random-hex-color-code-snippets/
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
  }

  private static getStorage(): any {
    return self['localStorage'];
  }

  private static saveState() {
    const storage = LoggerManager.getStorage();
    if (!storage) {
      return;
    }
    const state = {
      map: LoggerManager.instancesStateMap,
      levels: LoggerManager.levels,
    };
    storage.setItem(LoggerManager.STORAGE_KEY, JSON.stringify(state));
  }

  private static loadState() {
    const storage = LoggerManager.getStorage();
    if (!storage) {
      return;
    }
    let state: any = storage.getItem(LoggerManager.STORAGE_KEY);
    if (state) {
      state = JSON.parse(state);
      LoggerManager.instancesStateMap = state.map;
      LoggerManager.levels = state.levels;
    }
  }
}
