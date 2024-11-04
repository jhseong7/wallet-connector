interface ConfigOptions {
  baseUrl?: string;
  appName?: string;
  appLogoUrl?: string;
  jsonRpcUrl?: string;
  chainId?: number;
}

class Config {
  static instance: Config | null = null;

  public baseUrl: string;
  public appName: string;
  public appLogoUrl: string;
  public jsonRpcUrl: string;
  public chainId: number;

  constructor() {}

  static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  public initialize = (config: ConfigOptions): void => {
    this.baseUrl = config.baseUrl;
    this.appName = config.appName;
    this.appLogoUrl = config.appLogoUrl;
    this.jsonRpcUrl = config.jsonRpcUrl;
    this.chainId = config.chainId;
  };

  public updateConfig = (config: ConfigOptions): void => {
    if (config.baseUrl) this.baseUrl = config.baseUrl;
    if (config.appName) this.appName = config.appName;
    if (config.appLogoUrl) this.appLogoUrl = config.appLogoUrl;
    if (config.jsonRpcUrl) this.jsonRpcUrl = config.jsonRpcUrl;
    if (config.chainId) this.chainId = config.chainId;
  };
}

const config = Config.getInstance();

export { config, Config, ConfigOptions };
