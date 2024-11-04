import config from '../../config';
import KlaytnConnector from '../../connector/KlaytnConnector';
import { IDeepLinkConnector, IExtensionConnector, IQRConnector } from '../../interface';
import { Klaytn } from '../../interface/klaytn';
import { getDcentLink } from './common';

interface DcentKlaytn extends Klaytn {
  isDcentWallet: boolean;
}

interface DcentKlaytnInjectedWindow extends Window {
  klaytn?: DcentKlaytn;
}

class DcentKlaytnConnector extends KlaytnConnector implements IQRConnector, IExtensionConnector, IDeepLinkConnector {
  public qrCode: string;

  public deeplink: string;

  public supportsQRConnector: true = true;
  public supportsDeepLinkConnector: true = true;
  public supportsExtensionConnector: true = true;

  public static create = (): DcentKlaytnConnector => {
    return new DcentKlaytnConnector();
  };

  public qrCodeSetCallback: ((qrCode: string, validTime?: number) => void) | null;

  public deeplinkSetCallback: ((deeplink: string) => void) | null;

  // eslint-disable-next-line class-methods-use-this
  public hasExtension = () => {
    const { klaytn } = window as unknown as DcentKlaytnInjectedWindow;

    if (!klaytn) return false;

    return klaytn.isDcentWallet ?? false;
  };

  // eslint-disable-next-line class-methods-use-this
  public getInstallLink = () => {
    // TODO: make the network id LUT for dynamic chainId support
    return getDcentLink(config.baseUrl, 'klaytn-mainnet ');
  };

  // Callback setters
  public setQrCodeSetCallback = (callback: (qrCode: string, validTime?: number) => void) => {
    this.qrCodeSetCallback = callback;
  };

  public setDeeplinkSetCallback = (callback: (deeplink: string) => void) => {
    this.deeplinkSetCallback = callback;
  };

  // eslint-disable-next-line class-methods-use-this
  public abortPendingActivation = () => {};

  // eslint-disable-next-line class-methods-use-this
  public abortPendingTransaction = () => {};

  // eslint-disable-next-line class-methods-use-this
  public abortPendingSign = () => {};
}

export default DcentKlaytnConnector;
