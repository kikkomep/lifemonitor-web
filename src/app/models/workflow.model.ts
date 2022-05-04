import { RoCrate } from './common.models';
import { Registry } from './registry.models';
import {
  AggregatedStatusStats,
  AggregatedStatusStatsItem,
  Status,
} from './stats.model';
import { Suite } from './suite.models';
import { TestBuild } from './testBuild.models';

export class Workflow extends AggregatedStatusStatsItem {
  public: boolean;
  version: Object;
  status: Status;
  registries: Registry[];
  _type: string;
  _rocrate: RoCrate;
  _suites: AggregatedStatusStats;
  private _latestBuilds: TestBuild[];

  constructor(data: Object, status?: Object, suites?: AggregatedStatusStats) {
    super(data);
    if (status) {
      this.status = new Status(status);
    }
    if (suites) {
      this._suites = suites;
    }
    this.setName(data);
  }

  public update(rawData: Object) {
    super.update(rawData);
    this.setName(rawData);
  }

  private setName(data: Object) {
    let rocIdentifier = this.rocIdentifier;
    this.setNameFromProperty(
      data,
      'name',
      rocIdentifier ? rocIdentifier : data['uuid']
    );
  }

  public get rocIdentifier(): string {
    let crate: RoCrate = this.roCrateMetadata;
    if (crate) {
      let mainEntity: object = crate.mainEntity;
      if (mainEntity) {
        return mainEntity['@id'];
      }
    }
    return null;
  }

  public get type(): string {
    if (!this._type) {
      if (this._rawData && 'type' in this._rawData) {
        this._type = this._rawData['type'];
      } else {
        let crate: RoCrate = this.roCrateMetadata;
        if (crate) {
          let mainEntity: object = crate.mainEntity;
          if (mainEntity) {
            let programminLanguage = crate.findGraphEntity(
              mainEntity['programmingLanguage']['@id']
            );
            if (programminLanguage) {
              this._type = this.normalizeWorkflowTypeName(
                ('' + programminLanguage['name']).toLowerCase()
              );
              this.logger.debug('Workflow type detected: ', this._type);
              return this._type;
            }
          }
        } else if (this.version) {
          this._type = 'unknown';
          this.logger.debug('Workflow type detected: ', this._type);
        }
      }
    }
    return this._type;
  }

  private normalizeWorkflowTypeName(type: string): string {
    if (type === 'common workflow language') return 'cwl';
    if (type === 'unrecognized workflow type') return 'unknown';
    return type;
  }

  public get roCrateMetadata(): RoCrate {
    if (!this._rocrate && this.version && 'ro_crate' in this.version)
      this._rocrate = new RoCrate(this.version['ro_crate']['metadata']);
    return this._rocrate;
  }

  public get suites(): AggregatedStatusStats {
    return this._suites;
  }

  public set suites(suites: AggregatedStatusStats) {
    this._suites = suites;
    this.updateLatestBuilds();
    this.notifyChanges();
  }

  public asUrlParam() {
    return this.uuid;
  }

  public get typeIcon(): string {
    if (this.type === 'galaxy') return 'assets/img/logo/wf/GalaxyLogo.png';
    else if (this.type === 'snakemake')
      return 'assets/img/logo/wf/SnakeMakeLogo.png';
    else if (this.type === 'cwl') return 'assets/img/logo/wf/CwlLogo.png';
    else if (this.type === 'nextflow')
      return 'assets/img/logo/wf/NextFlowLogo.png';
    else if (this.type === 'jupyter')
      return 'assets/img/logo/wf/JupyterLogo.png';
    else if (this.type === 'knime') return 'assets/img/logo/wf/KnimeLogo.png';
    else if (this.type === 'shell script')
      return 'assets/img/logo/wf/ShellLogo.png';
    return 'assets/img/logo/wf/GenericWorkflowLogo.png';
  }

  public get typeIconSize(): number {
    if (this.type === 'galaxy') return 50;
    if (this.type === 'nextflow') return 40;
    else if (this.type === 'cwl') return 55;
    else if (this.typeIcon.endsWith('GenericWorkflowLogo.png')) return 48;
    return 45;
  }

  public get submitter(): object {
    return this.version ? this.version['submitter'] : null;
  }

  public get githubOrigin(): boolean {
    return this.originLink && this.originLink.startsWith('https://github');
  }

  public get basedOnLink(): string {
    if (this.version) {
      return this.version['links']['based_on'];
    } else {
      return null;
    }
  }

  public get originLink(): string {
    if (this.version) {
      return this.version['links']['origin'];
    } else {
      return null;
    }
  }

  public getRegistryLink(registry: string) {
    try {
      return this.version['links']['registries'][registry];
    } catch (Exception) {
      return null;
    }
  }

  public get metadataLink(): string {
    return this.version['ro_crate']['links']['metadata'];
  }

  public get downloadLink(): string {
    return this.version['ro_crate']['links']['download'];
  }

  get testInstances() {
    let instances = [];
    for (let s of this.suites.all) {
      for (let i of s['instances']['all']) instances.push(i);
    }
    return instances;
  }

  getStats() {
    return [];
  }

  public get latestTestBuilds(): TestBuild[] {
    return this.getLatestBuilds();
  }

  public getLatestBuilds(): TestBuild[] {
    return this._latestBuilds;
  }

  public updateLatestBuilds() {
    if (!this.suites) return null;
    let latestBuilds: TestBuild[] = [];
    for (let item of this.suites.all) {
      let suite: Suite = item as Suite;
      try {
        for (let inst of suite.instances.all) {
          for (let b of inst.latestBuilds) {
            latestBuilds.push(b);
          }
        }
      } catch (e) {
        this.logger.debug('Unable to load last builds');
        this._latestBuilds = [];
      }
    }

    this._latestBuilds = latestBuilds.sort((a, b) =>
      a.timestamp > b.timestamp || a.suite_uuid > b.suite_uuid ? 1 : -1
    );
  }
}
