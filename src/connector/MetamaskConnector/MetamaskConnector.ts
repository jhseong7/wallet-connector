import { MetamaskEthereum } from '../../interface/metamask';
import { IDeepLinkConnector, IExtensionConnector } from '../../interface/walletconnector';
import EthereumConnector from '../EthereumConnector';
import config from '../../config';

const META_INSTALL_LINK_CHROME = 'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn';
const META_INSTALL_LINK_FIREFOX = 'https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/';

// const getDappLink = (link: string) => `https://metamask.app.link/dapp/${link.replace(/^(https|http)?:\/\//g, '')}`;
const getDappLink = (link: string) => `https://metamask.app.link/dapp/${link}`; // Don't remove the protocol string

// The coinbase wallet only swaps the
class MetamaskConnector extends EthereumConnector implements IExtensionConnector, IDeepLinkConnector {
  deeplink: string;

  public supportsDeepLinkConnector: true = true;
  public supportsExtensionConnector: true = true;

  public deeplinkSetCallback: ((deeplink: string) => void) | null;

  constructor() {
    super();
    this.deeplink = '';
    this.deeplinkSetCallback = null;
  }

  public static getInstance(): EthereumConnector {
    if (!MetamaskConnector.instance) {
      MetamaskConnector.instance = new MetamaskConnector();
    }

    return MetamaskConnector.instance;
  }

  public static create(): MetamaskConnector {
    return new MetamaskConnector();
  }

  public hasExtension = () => {
    const ethereum = this.ethereum as unknown as MetamaskEthereum;

    if (!ethereum) return false;

    return ethereum.isMetaMask ?? false;
  };

  // eslint-disable-next-line class-methods-use-this
  public getInstallLink = () => {
    const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

    if (isFirefox) return META_INSTALL_LINK_FIREFOX;

    return META_INSTALL_LINK_CHROME;
  };

  public isUnlocked = async (): Promise<boolean | null> => {
    const ethereum = this.ethereum as unknown as MetamaskEthereum;

    if (!ethereum) return false;

    return ethereum?._metamask?.isUnlocked() ?? null;
  };

  setDeeplinkSetCallback = (callback: (deeplink: string) => void) => {
    this.deeplinkSetCallback = callback;

    // Set the deeplink now. => to the current dapp
    this.setDeepLink(getDappLink(config.baseUrl));
  };

  private setDeepLink = (deeplink: string) => {
    this.deeplink = deeplink;
    this.deeplinkSetCallback?.(deeplink);
  };

  // eslint-disable-next-line class-methods-use-this
  abortPendingActivation = () => {};

  // eslint-disable-next-line class-methods-use-this
  abortPendingTransaction = () => {};

  // eslint-disable-next-line class-methods-use-this
  abortPendingSign = () => {};
}

export default MetamaskConnector;
