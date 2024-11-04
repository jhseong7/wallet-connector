import { Ethereum } from './ethereum';

interface MetamaskEthereum extends Ethereum {
  isMetaMask: boolean;

  // NOTE: these methods are marked as experimental. They may become incompatible in the future.
  _metamask: {
    isEnabled: () => boolean;
    isUnlocked: () => Promise<boolean>;
  };
}

interface MetamaskInjectedWindow extends Window {
  ethereum: MetamaskEthereum;
}

export { MetamaskEthereum, MetamaskInjectedWindow };
