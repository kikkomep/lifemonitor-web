import { URLHandler } from './handler';

describe('URL Handler', () => {
  const baseUrl = 'https://lifemonitor.eu';
  let handler: URLHandler;

  beforeEach(() => {
    handler = new URLHandler(baseUrl);
  });

  it('should be created', () => {
    expect(handler).toBeTruthy();
  });

  it('should initialize and return the base URL', () => {
    expect(handler.baseUrl).toEqual(baseUrl);
  });

  it('should set the pathName withouth trailing slashes', () => {
    const basePathName = 'workflows';
    const result = handler.buildUrl(`${basePathName}/////`);
    expect(result).toEqual(`${baseUrl}/${basePathName}`);
  });

  it('should build a valid URL with parametric pathName and search params', () => {
    const basePathName = 'workflows';
    const params = {
      status: true,
      versions: true,
    };
    const result = handler.buildUrl(basePathName, params);
    expect(result).toEqual(
      `${baseUrl}/${basePathName}?status=true&versions=true`
    );
  });
});
