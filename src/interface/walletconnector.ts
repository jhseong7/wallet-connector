import { SignType } from 'enum';
import ChainType from '../enum/ChainType';
import WalletType from '../enum/WalletType';
import { IABIItem } from './abi';
import { IContract } from './contract';
import { ITransactionData, ITransactionResult } from './transaction';

// Interface for wallet state change callback handlers
interface IWalletStateChangeHandler {
  // Set a callback for when the wallet changes address
  setOnAddressChange: (callback: (address: string) => void) => void;

  // Set a callback for when the chain ID changes
  setOnChainChange: (callback: (chainId: string | number) => void) => void;
}

// Base Interface for the wallet connectors
interface IWalletConnector extends IWalletStateChangeHandler {
  chainId: string | number | undefined;
  currentAddress: string | undefined;

  // Wallet activation method
  activate: () => Promise<boolean>;

  // Sign request method => personal sign
  sign: (message: string) => Promise<string>;

  // Sign request method => typed data sign
  signTypedData: (msgParams: Record<string, any>, signType?: SignType) => Promise<string>;

  // Check if wallet is unlocked. returns null if wallet doesn't support this method
  isUnlocked: () => Promise<boolean | null>; // Null for not supported

  // Send a transaction with the given data
  sendTransaction: (transaction: ITransactionData) => Promise<ITransactionResult>;

  // Get a contract instance from the given ABI
  encodeContract: (abi: IABIItem[], contractAddress?: string) => IContract;

  // Restore the wallets state from the given data
  restoreState: (address: string, chaidId: string | number) => Promise<boolean>;

  // Get balance of native token (ETH, KLAY, MATIC, etc..)
  getBalance: () => Promise<string>;
}

// Extra interface for wallets that operate through a qr code (mobile wallets ETC)
interface IQRConnector {
  supportsQRConnector: true;

  qrCode: string;
  setQrCodeSetCallback: (callback: (qrCode: string, validTime?: number) => void) => void;
  abortPendingActivation: () => void;
  abortPendingTransaction: () => void;
  abortPendingSign: () => void;
}

// Extra Interface for wallets that operate through deeplinks
interface IDeepLinkConnector {
  supportsDeepLinkConnector: true;

  deeplink: string;
  setDeeplinkSetCallback: (callback: (deeplink: string) => void) => void;
  abortPendingActivation: () => void;
  abortPendingTransaction: () => void;
  abortPendingSign: () => void;
}

// Interface for wallets that are a browser extension
interface IExtensionConnector {
  supportsExtensionConnector: true;

  hasExtension: () => boolean;
  getInstallLink: () => string;
}

// Interface / type to represent a wallet state
interface IWalletState {
  address: string;
  chainId: string | number;
  chainType: ChainType;
  walletType: WalletType;
}

export type {
  IWalletStateChangeHandler,
  IWalletConnector,
  IQRConnector,
  IDeepLinkConnector,
  IExtensionConnector,
  IWalletState,
};
