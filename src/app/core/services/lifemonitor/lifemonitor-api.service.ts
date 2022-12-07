import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Logger } from 'typescript-logging-log4ts-style';
import { Workflow } from '../../models/workflow.model';
import { LoggerManager } from '../../utils/logging';

const API_URL = 'https://api.lifemonitor.eu/workflows';

@Injectable({
  providedIn: 'root',
})
export class LifemonitorApiService {
  // initialize logger
  private logger: Logger = LoggerManager.getLogger('LifemonitorApiService');

  constructor(private httpService: HttpClient) {}

  public getWorkflows(): Observable<Workflow[]> {
    return this.httpService.get(API_URL).pipe(
      map((data: any) => {
        this.logger.debug('Loaded workflows', data);
        return data['items'] as Workflow[];
      })
    );
  }
}
