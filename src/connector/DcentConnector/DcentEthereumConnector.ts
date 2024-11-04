import config from '../../config';
import EthereumConnector from '../../connector/EthereumConnector';
import { Ethereum } from '../../interface/ethereum';
import { IDeepLinkConnector, IExtensionConnector, IQRConnector } from '../../interface/walletconnector';
import { getDcentLink } from './common';

interface DcentEthereum extends Ethereum {
  isDcentWallet: boolean;
}

interface DcentEthereumInjectedWindow extends Window {
  ethereum?: DcentEthereum;
}

class DcentEthereumConnector
  extends EthereumConnector
  implements IQRConnector, IExtensionConnector, IDeepLinkConnector
{
  public qrCode: string;

  public deeplink: string;

  public supportsQRConnector: true = true;
  public supportsDeepLinkConnector: true = true;
  public supportsExtensionConnector: true = true;

  public static create = (): DcentEthereumConnector => {
    return new DcentEthereumConnector();
  };

  public qrCodeSetCallback: ((qrCode: string, validTime?: number) => void) | null;

  public deeplinkSetCallback: ((deeplink: string) => void) | null;

  // eslint-disable-next-line class-methods-use-this
  public hasExtension = () => {
    const { ethereum } = window as unknown as DcentEthereumInjectedWindow;

    if (!ethereum) return false;

    return ethereum.isDcentWallet ?? false;
  };

  // eslint-disable-next-line class-methods-use-this
  public getInstallLink = () => {
    // TODO: make the network id LUT for dynamic chainId support
    return getDcentLink(config.baseUrl, 'ethereum-mainnet');
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

export default DcentEthereumConnector;
