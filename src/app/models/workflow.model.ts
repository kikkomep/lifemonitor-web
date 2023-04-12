import { Model } from './base.models';
import { RoCrate } from './common.models';
import { Registry } from './registry.models';
import {
  AggregatedStatusStats,
  AggregatedStatusStatsItem,
  Status,
} from './stats.model';
import { Suite } from './suite.models';
import { TestBuild } from './testBuild.models';

export class Workflow extends Model {
  uuid: string;
  name: string;
  _version_descriptors: WorkflowVersionDescriptor[] = null;
  _current_version: WorkflowVersion = null;
  private __versions: { [name: string]: WorkflowVersion };

  constructor(rawData?: any, skip?: []) {
    super();
    let versions: [] = rawData?.versions ?? [];
    if ('versions' in rawData) delete rawData['versions'];
    this.update(rawData);
    this.updateDescriptors(versions, true);
  }

  public pickVersion(skip: string[] = null): WorkflowVersionDescriptor {
    this.logger.debug('Skip', skip);
    for (let v of this.versionDescriptors) {
      if (!skip || skip.length === 0) return v;
      else if (skip.indexOf(v.name) === -1) return v;
    }
    return null;
  }

  public findIndex(v: WorkflowVersion): number {
    return this.versions.findIndex(
      (obj) =>
        obj.uuid === v.uuid && obj.version['version'] === v.version['version']
    );
  }

  public set currentVersion(v: WorkflowVersion) {
    this._current_version = v;
    this.logger.debug('Updated current workflow version', v, this);
  }

  public get currentVersion(): WorkflowVersion {
    return this._current_version;
  }

  private get _versions(): { [name: string]: WorkflowVersion } {
    if (!this.__versions) this.__versions = {};
    return this.__versions;
  }

  public getVersion(version: string): WorkflowVersion {
    try {
      return this._versions[version];
    } catch (e) {
      return null;
    }
  }

  public addVersion(
    v: WorkflowVersion,
    setAsCurrent: boolean = false,
    setAsLatest?: boolean
  ) {
    if (v) {
      this._versions[v.version['version']] = v;
      v.workflow = this;
      if (setAsCurrent) this.currentVersion = v;
      if (!this.getVersionDescriptor(v.version['version'])) {
        let data = { ...v.version };
        delete data['links'];
        delete data['name'];
        this.logger.debug('Data VERSION: ', v.version, data, this);
        this.addVersionDescriptor(data);
      }
    }
  }

  public removeVersion(
    version: WorkflowVersion | string,
    removeDescriptor: boolean = true
  ) {
    const v: WorkflowVersion =
      version instanceof WorkflowVersion ? version : this.getVersion(version);
    if (v && v.workflow == this) {
      delete this._versions[v.version['version']];
      v.workflow = null;
      if (removeDescriptor && this._version_descriptors) {
        let index = this._version_descriptors.findIndex(
          (d: WorkflowVersionDescriptor) => d.name === v.version['version']
        );
        if (this.currentVersion === v) {
          this.currentVersion = null;
        }
        if (index > -1) {
          this._version_descriptors.splice(index, 1);
        }
      }
    }
  }

  public set versions(versions: WorkflowVersion[]) {
    this.__versions = {};
    for (let v of versions) {
      this._versions[v.version['version']] = v;
    }
  }

  public get versions(): WorkflowVersion[] {
    return Object.values(this._versions);
  }

  public updateDescriptors(versions: [], replaceExisting: boolean = false) {
    this._version_descriptors = replaceExisting
      ? []
      : this._version_descriptors;
    if (versions) {
      versions.forEach((v) => {
        this._version_descriptors.push(new WorkflowVersionDescriptor(v));
      });
    }
  }

  public getVersionDescriptor(version: string): WorkflowVersionDescriptor {
    return this._version_descriptors.find((v) => v.name === version);
  }

  public addVersionDescriptor(version: object) {
    let vd = new WorkflowVersionDescriptor(version);
    if (vd.isLatest) {
      this._version_descriptors.forEach((v) => {
        v.isLatest = false;
      });
    }
    this._version_descriptors.push(vd);
  }

  public get versionDescriptors(): WorkflowVersionDescriptor[] {
    return this._version_descriptors;
  }
}

export class WorkflowVersion extends AggregatedStatusStatsItem {
  public: boolean;
  _workflow: Workflow;
  version: Object;
  status: Status;
  _previous_versions: WorkflowVersionDescriptor[];
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

  public set workflow(w: Workflow) {
    this._workflow = w;
  }

  public get workflow(): Workflow {
    return this._workflow;
  }

  public update(rawData: Object) {
    if (rawData) {
      super.update(rawData);
      this.setName(rawData);
    }
  }

  public setName(data: Object) {
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

  public get authors(): [] {
    return this.version ? this.version['authors'] : [];
  }

  public get type(): string {
    if (!this._type) {
      if (this._rawData && 'type' in this._rawData) {
        this._type = this._rawData['type'] as string;
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

  public get previousVersions(): WorkflowVersionDescriptor[] {
    return this._previous_versions;
  }

  public set previousVersions(versions: WorkflowVersionDescriptor[]) {
    if (!versions) return;
    this._previous_versions = [];
    for (let v of versions) {
      this._previous_versions.push(new WorkflowVersionDescriptor(v));
    }
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

  public get created(): number {
    return this._rawData['meta']['created'];
  }

  public get modified(): number {
    return this._rawData['meta']['modified'];
  }

  public set modified(m: number) {
    this._rawData['meta']['modified'] = m;
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

export class WorkflowVersionDescriptor extends Model {
  submitter: Object;

  public get name(): string {
    return this._rawData['version'];
  }

  public get isLatest(): boolean {
    return this._rawData['is_latest'];
  }

  public set isLatest(value: boolean) {
    this._rawData['is_latest'] = value;
  }

  public get links(): Object {
    return 'ro_crate' in this._rawData
      ? this._rawData['ro_crate']['links']
      : [];
  }
}

export class WorkflowsLoadingStatus {
  private _workflows: Array<{ uuid: string }>;
  private _loaded: { [key: string]: boolean } = {};

  constructor(workflows: Array<Workflow>) {
    this._workflows = workflows;
  }

  public get workflows(): Array<{ uuid: string }> {
    return this._workflows;
  }

  public setLoaded(uuid: string) {
    this._loaded[uuid] = true;
  }

  public get loaded(): Array<{ uuid: string }> {
    return this._workflows.filter((w) => w.uuid in this._loaded);
  }

  public get completionPercentage(): number {
    return Math.floor(
      (Object.keys(this._loaded).length / this._workflows.length) * 100
    );
  }
}
