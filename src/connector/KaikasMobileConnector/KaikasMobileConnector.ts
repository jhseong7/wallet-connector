import Caver from 'caver-js';
import config from '../../config';
import { IABIItem } from '../../interface/abi';
import { IContractEncoder } from '../../interface/contract';
import { IWalletConnector, IQRConnector, IDeepLinkConnector } from '../../interface/walletconnector';
import { ITransactionData, ITransactionReceipt, ITransactionResult } from '../../interface/transaction';
import { abiFunctionNameFilter } from '../../util/abiFiilter';
import CaverContractEncoder from '../../contract/CaverContractEncoder';
import { getResult, prepare } from './klutch-function';
import BaseChangeEventHandler from '../BaseImplementation/BaseChangeEventHandler';
import {
  InvalidTransactionParametersException,
  InvalidTransactionReceiptException,
  TransactionException,
} from '../../exception/transaction';
import { handleByKlutchStatus } from './util';
import { IResultAuth, IResultContractExecute, IResultSign } from './type';
import { UnsupportedFunction } from '../../exception';
import { SignType } from '../../enum';

const MAX_TIMEOUT_SEC = 300;

// Function to get the QR code for the Klip wallet
// const getKlutchQrString = (requestKey: string) => `https://klutch.page/a/${requestKey}`;
const getKlutchQrString = (requestKey: string) => `https://app.kaikas.io/a/${requestKey}`;

// Function to get the deep link for the Klip wallet
const getKlutchDeeplink = (requestKey: string) => {
  const isIos = navigator.userAgent.match(/iPad|iPhone|iPod/i);
  const isAndroid = navigator.userAgent.indexOf('Android') > -1;

  if (isIos) return `klutch://wallet/api?request_key=${requestKey}`;

  if (isAndroid)
    return `intent://wallet/api?request_key=${requestKey}#Intent;scheme=klutch;package=io.klutch.wallet;end`;

  // Else => is a web browser
  return `https://app.kaikas.io/a/${requestKey}`;
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

class KaikasMobileConnector
  extends BaseChangeEventHandler
  implements IWalletConnector, IQRConnector, IDeepLinkConnector
{
  public chainId: number | string | undefined;

  public currentAddress: string | undefined;

  private contractEncoder: IContractEncoder;

  private bAppName: string;

  private static instance: KaikasMobileConnector | null = null;

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

  public static getInstance(): KaikasMobileConnector {
    if (!KaikasMobileConnector.instance) {
      KaikasMobileConnector.instance = new KaikasMobileConnector();
    }
    return KaikasMobileConnector.instance;
  }

  public static create(): KaikasMobileConnector {
    return new KaikasMobileConnector();
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

        const result = await getResult.auth(this.requestKey);

        count += 1;
        if (count > MAX_TIMEOUT_SEC) resolve(false);

        handleByKlutchStatus<IResultAuth>({
          result,
          onComplete: () => {
            this.setCurrentAddress(result.result?.klaytn_address ?? '');
            this.setChainId(result.chain_id);
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
    const result = await prepare.sign({ bappName: config.appName, message, from: this.currentAddress });

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

        const result = await getResult.sign(this.requestKey);

        count += 1;
        if (count > MAX_TIMEOUT_SEC) reject(new Error('Timeout'));

        handleByKlutchStatus<IResultSign>({
          result,
          onComplete: () => {
            resolve(result.result.signed_data);
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

        const result = await getResult.executeContract(this.requestKey);

        count += 1;
        if (count > MAX_TIMEOUT_SEC) resolve(null);

        await handleByKlutchStatus<IResultContractExecute>({
          result,
          onComplete: async () => {
            // If result succeeded. get the transaction receipt from the hash
            clearInterval(interval);
            // If failed
            if (result.status !== 'completed') {
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
            reject(new Error('Klutch server returned an error. ' + result.message));
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

    this.deeplink = getKlutchDeeplink(requestKey);
    this.qrCode = getKlutchQrString(requestKey);
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

  public restoreState = async (address: string, chaidId: string | number) => {
    this.setCurrentAddress(address);
    this.setChainId(chaidId);

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
}

export default KaikasMobileConnector;
