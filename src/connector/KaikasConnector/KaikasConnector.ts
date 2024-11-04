import { Klaytn } from '../../interface/klaytn';
import { IExtensionConnector } from '../../interface/walletconnector';
import KlaytnConnector from '../KlaytnConnector';

interface KaikasKlaytn extends Klaytn {
  isKaikas: boolean;

  // NOTE: these methods are marked as experimental. They may become incompatible in the future.
  _kaikas: {
    isEnabled: () => boolean;
    isUnlocked: () => Promise<boolean>;
  };
}

interface KaikasInjectedWindow extends Window {
  klaytn: KaikasKlaytn;
}

const KAIKAS_INSTALL_LINK = 'https://chrome.google.com/webstore/detail/kaikas/jblndlipeogpafnldhgmapagcccfchpi?hl=ko';

// The coinbase wallet only swaps the
class KaikasConnector extends KlaytnConnector implements IExtensionConnector {
  public supportsExtensionConnector: true = true;

  public static getInstance(): KlaytnConnector {
    if (!KaikasConnector.instance) {
      KaikasConnector.instance = new KaikasConnector();
    }

    return KaikasConnector.instance;
  }

  public static create(): KlaytnConnector {
    return new KaikasConnector();
  }

  // eslint-disable-next-line class-methods-use-this
  public hasExtension = () => {
    const { klaytn } = window as unknown as KaikasInjectedWindow;

    if (!klaytn) return false;

    return klaytn.isKaikas ?? false;
  };

  // eslint-disable-next-line class-methods-use-this
  public getInstallLink = () => {
    return KAIKAS_INSTALL_LINK;
  };

  // eslint-disable-next-line class-methods-use-this
  public isUnlocked = async (): Promise<boolean | null> => {
    const { klaytn } = window as unknown as KaikasInjectedWindow;

    if (!klaytn) return false;

    return klaytn?._kaikas?.isUnlocked() ?? null;
  };
}

export default KaikasConnector;
