import { Level, Logger, LoggerManager } from "typescript-logger";

// import
export * from "typescript-logger";

// intialise root logger
export const rootLogger: Logger = LoggerManager.create('lifemonitor');

export class Config {

  static init(config: object) {
    console.warn(config, config['production'] === true)
    if (config['production'] === true) {
      LoggerManager.onlyLevels(Level.WARN, Level.INFO);
      LoggerManager.setProductionMode();
      LoggerManager.muteAllModules();
    } else {
      LoggerManager.onlyLevels(Level.DEBUG, Level.ERROR, Level.WARN, Level.INFO, Level.LOG);
      LoggerManager.unMuteAllModules();
    }
  }
}


