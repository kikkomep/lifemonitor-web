export enum TestingServiceType {
  jenkins,
  travis,
  github,
}

export interface TestingService {
  type: TestingServiceType;
  url: string;
}
