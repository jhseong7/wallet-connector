import { ConfigOptions } from '../config/config';

interface IWalletManagerOptions extends ConfigOptions {
  targetChainId?: number;
  walletAutoConnect?: boolean;
  useAsMobxStore?: boolean;
  autoDisconnectOnChainMismatch?: boolean;
}

export { IWalletManagerOptions };
