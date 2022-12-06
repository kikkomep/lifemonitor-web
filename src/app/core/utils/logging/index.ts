import { LogLevel } from 'typescript-logging';
import { Log4TSProvider } from 'typescript-logging-log4ts-style';

export { Logger } from 'typescript-logging-log4ts-style';

export const LoggerManager = Log4TSProvider.createProvider('Log4TSProvider', {
  level: LogLevel.Debug,
  groups: [
    {
      expression: new RegExp('.+'),
    },
  ],
});
