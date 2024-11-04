import Caver from 'caver-js';
import config from '../../config';
import { IABIItem } from '../../interface/abi';
import { IContractEncoder } from '../../interface/contract';
import { IWalletConnector, IQRConnector, IDeepLinkConnector } from '../../interface/walletconnector';
import { ITransactionData, ITransactionReceipt, ITransactionResult } from '../../interface/transaction';
import { abiFunctionNameFilter } from '../../util/abiFiilter';
import CaverContractEncoder from '../../contract/CaverContractEncoder';
import { getResult, prepare } from './klip-function';
import BaseChangeEventHandler from '../../connector/BaseImplementation/BaseChangeEventHandler';
import {
  InvalidTransactionParametersException,
  InvalidTransactionReceiptException,
  TransactionException,
} from '../../exception/transaction';
import { handleByKlipStatus } from './util';
import { UnsupportedFunction } from '../../exception';
import { ChainType, SignType } from '../../enum';

const MAX_TIMEOUT_SEC = 300;
const KLAYTN_NETWORK_VERSION = 8217;

// Function to get the QR code for the Klip wallet
const getKlipQrString = (requestKey: string) => `https://klipwallet.com/?target=/a2a?request_key=${requestKey}`;

// Function to get the deep link for the Klip wallet
const getKlipDeeplink = (requestKey: string) => {
  const isIos = navigator.userAgent.match(/iPad|iPhone|iPod/i);
  // const isAndroid = navigator.userAgent.indexOf('Android') > -1;

  // if (isIos) return `kakaotalk://klipwallet/open?url=https://klipwallet.com/?target=/a2a?request_key=${requestKey}`;

  // if (isAndroid)
  //   return `intent://klipwallet/open?url=https://klipwallet.com/?target=/a2a?request_key=${requestKey}#Intent;scheme=kakaotalk;package=com.kakao.talk;end`;

  // Else => is a web browser
  return `https://klipwallet.com/?target=/a2a?request_key=${requestKey}`;
};

/**
 * This function preprocesses the klip signature which currently has a bug. the V value is returned in a odd way
 * the last part of the signature must to be converted to the corresponding hex value
 *
 * 4055 -> 1b
 * 4056 -> 1c
 * @param signature
 */
const preprocessKlipSign = (signature: string) => {
  // If the signature is longer than a proper string (132 characters) then preprocess it

  // This is a normal case
  if (signature.length === 132) {
    return signature;
  }

  if (signature.endsWith('4055')) {
    return signature.slice(0, -4) + '1b';
  }

  if (signature.endsWith('4056')) {
    return signature.slice(0, -4) + '1c';
  }

  return signature;
};

class KlipConnector extends BaseChangeEventHandler implements IWalletConnector, IQRConnector, IDeepLinkConnector {
  public chainId: number | string | undefined;

  public currentAddress: string | undefined;

  private contractEncoder: IContractEncoder;

  private bAppName: string;

  private static instance: KlipConnector | null = null;

  public requestKey: string;

  public deeplink: string;

  public qrCode: string;

  public qrCodeSetCallback: ((qrCode: string, validTime?: number) => void) | null;

  public deeplinkSetCallback: ((deeplink: string) => void) | null;

  public supportsQRConnector: true = true;
  public supportsDeepLinkConnector: true = true;

  private activateIntervalHandler: NodeJS.Timer[] = [];

  private transactionIntervalHandler: NodeJS.Timer[] = [];

  private signIntervalHandler: NodeJS.Timer[] = [];

  constructor() {
    super();

    this.chainId = KLAYTN_NETWORK_VERSION;
    this.bAppName = config.appName;
    this.requestKey = '';
    this.contractEncoder = CaverContractEncoder.create(config.jsonRpcUrl);
    this.deeplink = '';
    this.qrCode = '';
    this.qrCodeSetCallback = null;
    this.deeplinkSetCallback = null;
    this.onAddressChangeCallback = null;
    this.onChainChangeCallback = null;
  }

  // Return the chain name to use for sending klip requests
  private getChainName(): 'klaytn' | 'ethereum' {
    if (this.chainId === KLAYTN_NETWORK_VERSION) return 'klaytn';

    return 'ethereum';
  }

  public static getInstance(): KlipConnector {
    if (!KlipConnector.instance) {
      KlipConnector.instance = new KlipConnector();
    }
    return KlipConnector.instance;
  }

  public static create(): KlipConnector {
    return new KlipConnector();
  }

  // eslint-disable-next-line class-methods-use-this
  public isUnlocked = async () => {
    return null;
  };

  public activate = async (): Promise<boolean> => {
    const result = await prepare.auth({ bappName: this.bAppName });

    if (result.err) return false;

    // Set the request key. this auto sets the qr and deeplink string
    this.setRequestKey(result.request_key);

    // Emit callbacks to set QR code and deeplink
    this.qrCodeSetCallback?.(this.qrCode, MAX_TIMEOUT_SEC);
    this.deeplinkSetCallback?.(this.deeplink);

    // Return a loop that polls for the result of the request
    return new Promise<boolean>((resolve) => {
      // poll for the result
      let count = 0;
      const interval = setInterval(async () => {
        // Already logged in
        if (!this.requestKey) {
          // Clear the flag
          this.abortPendingActivation();
          resolve(true);
          return;
        }

        const result = await getResult(this.requestKey);

        count += 1;
        if (count > MAX_TIMEOUT_SEC) resolve(false);

        handleByKlipStatus({
          result,
          onComplete: () => {
            // FIXME: replace this with a return chain if KLIP adds support for this in the future
            this.setChainId(this.chainId);
            this.setCurrentAddress(result.result?.klaytn_address ?? '');
            resolve(true);
          },
          onCancel: () => {
            resolve(false);
          },
          onError: () => {
            resolve(false);
          },
          postAction: () => {
            this.abortPendingSign();
            this.clearLinkAndCode();
          },
        });
      }, 1000);

      this.activateIntervalHandler.push(interval);
    });
  };

  public abortPendingActivation = () => {
    // This will abort the klip request loop (any that is pending)
    if (this.activateIntervalHandler) {
      this.activateIntervalHandler.forEach((handler) => clearInterval(handler));
      this.activateIntervalHandler = [];
    }
  };

  public abortPendingSign = () => {
    // This will abort the klip request loop (any that is pending)
    if (this.signIntervalHandler) {
      this.signIntervalHandler.forEach((handler) => clearInterval(handler));
      this.signIntervalHandler = [];
    }
  };

  public sign = async (message: string): Promise<string> => {
    const result = await prepare.sign({
      bappName: config.appName,
      value: message,
      from: this.currentAddress,
      chain: this.getChainName(),
    });

    if (result.err || result.error) {
      throw new Error("Can't sign message");
    }

    // Set the request key. this auto sets the qr and deeplink string
    this.setRequestKey(result.request_key);

    // Emit callbacks to set QR code and deeplink
    this.qrCodeSetCallback?.(this.qrCode, MAX_TIMEOUT_SEC);
    this.deeplinkSetCallback?.(this.deeplink);

    // Return a loop that polls for the result of the request
    return new Promise<string>((resolve, reject) => {
      // poll for the result
      let count = 0;
      const interval = setInterval(async () => {
        // Already logged in
        if (!this.requestKey) {
          // Clear the flag
          this.abortPendingSign();
          reject(new Error('Already signed message'));
          return;
        }

        const result = await getResult(this.requestKey);

        count += 1;
        if (count > MAX_TIMEOUT_SEC) reject(new Error('Timeout'));

        handleByKlipStatus({
          result,
          onComplete: () => {
            // FIXME: replace this with a return chain if KLIP adds support for this in the future
            this.setChainId(this.chainId);

            const processedSig = preprocessKlipSign(result.result?.signature);

            resolve(processedSig);
          },
          onCancel: () => {
            clearInterval(interval);
            reject(new Error('User Cancelled'));
          },
          onError: () => {
            clearInterval(interval);
            reject(new Error('User Cancelled'));
          },
          postAction: () => {
            this.abortPendingSign();
            this.clearLinkAndCode();
          },
        });
      }, 1000);

      this.signIntervalHandler.push(interval);
    });
  };

  // eslint-disable-next-line class-methods-use-this
  public signTypedData = async (msgParams: Record<string, any>, signType?: SignType): Promise<string> => {
    throw new UnsupportedFunction();
  };

  public sendTransaction = async (transaction: ITransactionData) => {
    const { abi, params } = transaction;
    // const contract = this.encodeContract(abi, transaction.to);

    const filteredAbi = abiFunctionNameFilter(transaction.functionName, abi);
    if (filteredAbi === null) {
      throw new InvalidTransactionParametersException();
    }

    const res = await prepare.executeContract({
      bappName: config.appName,
      to: transaction.to,
      value: transaction.value.toString(),
      abi: JSON.stringify(filteredAbi), // TODO: check this
      params: JSON.stringify(params),
      from: this.currentAddress,
      chain: this.getChainName(),
    });

    if (res.err || res.error) {
      new TransactionException();
    }

    // Set the request key. this auto sets the qr and deeplink string
    this.setRequestKey(res.request_key);

    // Emit callbacks to set QR code and deeplink
    this.qrCodeSetCallback?.(this.qrCode, MAX_TIMEOUT_SEC);
    this.deeplinkSetCallback?.(this.deeplink);

    // Poll for TX success
    return new Promise<ITransactionResult>((resolve, reject) => {
      // poll for the result
      let count = 0;
      const interval = setInterval(async () => {
        // Already logged in
        if (!this.requestKey) {
          clearInterval(interval);
          resolve(null);
          return;
        }

        const result = await getResult(this.requestKey);

        count += 1;
        if (count > MAX_TIMEOUT_SEC) resolve(null);

        await handleByKlipStatus({
          result,
          onComplete: async () => {
            // If result succeeded. get the transaction receipt from the hash
            clearInterval(interval);
            // If failed
            if (result.result?.status !== 'success') {
              resolve(null);
              this.clearLinkAndCode();
              return;
            }

            // On success
            const txHash = result.result.tx_hash;

            // TODO: make throw when no txHash is returned
            if (!txHash) {
              resolve(null);
              this.clearLinkAndCode();
              return;
            }

            // Get the transaction receipt
            const caver = new Caver(config.jsonRpcUrl);
            try {
              const receipt = await caver.rpc.klay.getTransactionReceipt(txHash);

              if (!receipt) {
                throw new InvalidTransactionReceiptException();
              }

              const result: ITransactionResult = {
                transactionHash: txHash,
                receipt: {
                  status: receipt.status,
                  transactionHash: receipt.transactionHash,
                  transactionIndex: receipt.transactionIndex,
                  blockHash: receipt.blockHash,
                  blockNumber: receipt.blockNumber,
                  gasUsed: receipt.gasUsed,
                  from: receipt.from,
                  to: receipt.to,
                },
                nativeReceipt: receipt,
              };

              resolve(result);
            } catch (e) {
              // TODO: Add additional error handling for different types of wallet errors
              if (e instanceof InvalidTransactionReceiptException) {
                reject(e);
              } else {
                reject(new TransactionException());
              }
            } finally {
              this.clearLinkAndCode();
            }
          },
          onCancel: async () => {
            reject(new TransactionException());
          },
          onError: async () => {
            reject(new Error('Klip server returned an error. ' + result.error));
          },
          postAction: () => {
            this.abortPendingTransaction();
            this.clearLinkAndCode();
          },
        });
      }, 1000);

      this.transactionIntervalHandler.push(interval);
    });
  };

  public abortPendingTransaction = () => {
    // This will abort the klip request loop (any that is pending)
    if (this.transactionIntervalHandler) {
      this.transactionIntervalHandler.forEach((handler) => clearInterval(handler));
      this.transactionIntervalHandler = [];
    }
  };

  public encodeContract = (abi: IABIItem[], contractAddress?: string) => {
    return this.contractEncoder.encodeContract(abi, contractAddress);
  };

  // Set the request key and the qr and deeplink
  private setRequestKey = (requestKey: string) => {
    this.requestKey = requestKey;

    this.deeplink = getKlipDeeplink(requestKey);
    this.qrCode = getKlipQrString(requestKey);
  };

  private clearLinkAndCode = () => {
    this.requestKey = '';
    this.deeplink = '';
    this.qrCode = '';
  };

  private setCurrentAddress = (address: string) => {
    this.currentAddress = address;
    if (this.onAddressChangeCallback) this.onAddressChangeCallback(address);
  };

  private setChainId = (chainId: string | number) => {
    this.chainId = chainId;
    if (this.onChainChangeCallback) this.onChainChangeCallback(chainId);
  };

  // Callback setters
  public setQrCodeSetCallback = (callback: (qrCode: string, validTime?: number) => void) => {
    this.qrCodeSetCallback = callback;
  };

  public setDeeplinkSetCallback = (callback: (deeplink: string) => void) => {
    this.deeplinkSetCallback = callback;
  };

  public restoreState = async (address: string, chainId: string | number) => {
    this.setCurrentAddress(address);
    this.setChainId(chainId);

    return true;
  };

  // Get balance for klip.
  public getBalance = async (): Promise<string> => {
    const caver = new Caver(config.jsonRpcUrl);

    try {
      const balance = await caver.klay.getBalance(this.currentAddress);
      return caver.utils.toBN(balance).toString();
    } catch (e) {
      return null;
    }
  };

  // Custom function for klip to manually set the chain type.
  public setChainType(chainType: ChainType) {
    if (chainType === ChainType.KLAYTN) {
      this.setChainId(KLAYTN_NETWORK_VERSION);
      return;
    }

    if (chainType === ChainType.ETHEREUM) {
      // Ethereum
      this.setChainId(1);
      return;
    }

    throw new Error('Unsupported chain type');
  }
}

export default KlipConnector;
