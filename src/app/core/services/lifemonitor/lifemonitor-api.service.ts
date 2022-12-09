import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Logger } from 'typescript-logging-log4ts-style';
import { Workflow } from '../../models/workflow.model';
import { BaseService } from '../../utils/base-service/base-service';
import { LoggerManager } from '../../utils/logging';

@Injectable({
  providedIn: 'root',
})
export class LifeMonitorApiService extends BaseService {
  // initialize logger
  private logger: Logger = LoggerManager.getLogger('LifeMonitorApiService');

  public getUserWorkflows(
    versions: boolean = true,
    status: boolean = false
  ): Observable<Workflow[]> {
    return this.doGet('workflows', {
      params: {
        versions: versions,
        status: status,
      },
      withCredentials: true,
    }).pipe(
      map((data: any) => {
        this.logger.debug('Loaded workflows', data);
        return data['items'] as Workflow[];
      })
    );
  }

  public getPublicWorkflows(
    versions: boolean = true,
    status: boolean = false
  ): Observable<Workflow[]> {
    return this.doGet('workflows', {
      params: {
        versions: versions,
        status: status,
      },
      withCredentials: false,
    }).pipe(
      map((data: any) => {
        this.logger.debug('Loaded public workflows', data);
        return data['items'] as Workflow[];
      })
    );
  }
}
