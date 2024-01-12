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

import { Level } from "./level";
import { Display } from "./display";

/**
 * This is the logger created by the *LoggerManager*, it has all the methods to allow different levels of logging.
 * Every level has a color as border for the message.
 */
export class Logger {

  /**
   *
   * @param name Logger name, this is the first information written for each log created
   * @param color Color of the background for the *name* in the log. This can be any CSS color name or hexadecimal string. You can set the color also after the creation of the logger
   * @param fixedWidth Width of the logger name part, if passed and the *name* is shorter than padding will be added to reach the width
   */
  constructor(private name: string,
    public color: string,
    private fixedWidth: number) {
  }

  /**
   * This logs a message and the data with *Level.DEBUG*
   * @param message A message to print along the logger name
   * @param data The optional data to log
   */
  debug(message: string, ...data: any[]) {
    return this._logMessage(message, Level.DEBUG, data);
  }

  /**
   * This logs a message and the data with *Level.DEBUG*
   * @param message A message to print along the logger name
   * @param data The optional data to log
   */
  log(message: string, ...data: any[]) {
    return this._logMessage(message, Level.LOG, data);
  }

  /**
   * This logs a message and the data with *Level.ERROR*
   * @param message A message to print along the logger name
   * @param data The optional data to log
   */
  error(message: string, ...data: any[]) {
    return this._logMessage(message, Level.ERROR, data);
  }

  /**
   * This logs a message and the data with *Level.INFO*
   * @param message A message to print along the logger name
   * @param data The optional data to log
   */
  info(message: string, ...data: any[]) {
    return this._logMessage(message, Level.INFO, data);
  }

  /**
   * This logs a message and the data with *Level.WARN*
   * @param message A message to print along the logger name
   * @param data The optional data to log
   */
  warn(message: string, ...data: any[]) {
    return this._logMessage(message, Level.WARN, data);
  }

  /**
   * Internal method that ask to the Display class to handle the log
   * @param message A message to print along the logger name
   * @param level Level associated to the log entry
   * @param data The optional data to log
   * @private
   */
  private _logMessage(message: string, level: Level, ...data: any[]) {
    Display.msg(message, data, this.name, this.color, level, this.fixedWidth);
    return this;
  }

}
