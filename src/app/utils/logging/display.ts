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

import { Level } from './level';
import { LoggerManager } from './loggerManager';

export class Display {
  /**
   * Method that acts as a proxy to the *console*
   * @param message The initial string after the *moduleName*; this will be enclosed in a rectangular border of the corresponding color
   * @param params Topically the objects to log
   * @param moduleName The name of the logger
   * @param moduleColor The color associated to the logger
   * @param level Type of log (i.e. DEBUG, INFO, etc...)
   * @param moduleWidth Width of the logger name. If the *moduleName* is less than this spaces will be added as padding.
   */
  static msg(
    message: string,
    params: any[],
    moduleName: string,
    moduleColor: string,
    level: Level,
    moduleWidth: number
  ) {
    if (
      LoggerManager.isProductionMode() ||
      !LoggerManager.isLevelAllowed(level) ||
      LoggerManager.isMuted(moduleName)
    )
      return;
    let color: string;
    switch (level) {
      case Level.DEBUG:
        color = 'violet';
        break;
      case Level.ERROR:
        color = 'red';
        break;
      case Level.INFO:
        color = 'deepskyblue';
        break;
      case Level.LOG:
        color = 'gray';
        break;
      case Level.WARN:
        color = 'orange';
        break;
    }

    if (moduleWidth) {
      const diff = moduleWidth - moduleName.length;
      if (diff > 0) {
        for (let i = 0; i < diff; i++) {
          moduleName += ' ';
        }
      }
    }

    let a1 =
      '%c ' +
      Level[level] +
      '@' +
      moduleName +
      ' %c ' +
      new Date().toUTCString() +
      ' | ' +
      message +
      ' ';
    let a2 =
      'background: ' +
      moduleColor +
      ';color:white; border: 1px solid ' +
      moduleColor +
      '; ';
    let a3 = 'border: 1px solid ' + color + '; ';
    params = params[0];
    params.unshift(a3);
    params.unshift(a2);
    params.unshift(a1);
    // _console.log.apply(_console, params);
    switch (level) {
      case Level.INFO:
        console.info.apply(console, params);
        break;
      case Level.DEBUG:
        console.debug.apply(console, params);
        break;
      case Level.LOG:
        console.log.apply(console, params);
        break;
      case Level.WARN:
        console.warn.apply(console, params);
        break;
      case Level.ERROR:
        console.error.apply(console, params);
        break;
    }
  }
}
