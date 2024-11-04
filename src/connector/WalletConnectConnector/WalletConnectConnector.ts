import { SignType } from '../../enum';
import {
  IABIItem,
  IContract,
  IContractEncoder,
  IQRConnector,
  ITransactionData,
  IWalletConnector,
} from '../../interface';
import { ITransactionResult } from '../../interface/transaction';
import BaseChangeEventHandler from '../BaseImplementation/BaseChangeEventHandler';

// import WalletConnectProvider from '@walletconnect/web3-provider';
import WalletConnect from '@walletconnect/client';
import { IInternalEvent } from '@walletconnect/types';
import { Web3ContractEncoder } from '../../contract';
import { InvalidTransactionReceiptException } from '../../exception';
import { signUtil } from '../../util/sign';
class WalletConnectConnector extends BaseChangeEventHandler implements IWalletConnector, IQRConnector {
  chainId: string | number;
  currentAddress: string;

  public supportsQRConnector: true = true;

  // private readonly provider: WalletConnectProvider;

  public qrCode: string;

  private contractEncoder: IContractEncoder;

  private walletConnect: WalletConnect | null = null;

  private internalRpcId = 0;

  private qrCodeSetCallback: ((qrCode: string, validTime?: number) => void) | null;

  constructor() {
    super();

    this.contractEncoder = Web3ContractEncoder.create();
  }

  public setQrCodeSetCallback = (callback: (qrCode: string, validTime?: number) => void): void => {
    this.qrCodeSetCallback = callback;
  };

  // eslint-disable-next-line class-methods-use-this
  public abortPendingActivation = () => {
    // NOTE: This is not supported by WalletConnect as walletconnect does not use polling
  };

  // eslint-disable-next-line class-methods-use-this
  public abortPendingTransaction = () => {
    // NOTE: This is not supported by WalletConnect as walletconnect does not use polling
  };

  // eslint-disable-next-line class-methods-use-this
  public abortPendingSign = () => {
    // NOTE: This is not supported by WalletConnect as walletconnect does not use polling
  };

  public static create = () => {
    return new WalletConnectConnector();
  };

  public activate = async (): Promise<boolean> => {
    return new Promise<boolean>(async (resolve, reject) => {
      let isActivated = false;

      // If the connector is already activated, kill the old connection
      if (this.walletConnect) {
        window.localStorage.removeItem('walletconnect');
        if (this.walletConnect.connected) await this.walletConnect.killSession();
      }

      // Create the WalletConnect instance here to set the callbacks correctly
      this.walletConnect = new WalletConnect({
        bridge: 'https://bridge.walletconnect.org',
        qrcodeModal: {
          open: (uri) => {
            console.log('open', uri);
            this.qrCodeSetCallback?.(uri);
          },
          close: () => {
            console.log('close');
            // NOTE: resolve false here because the success case will be handled by the event listener (connect);
          },
        },
      });

      // Subscribe to connection events
      this.walletConnect.on('connect', (error, payload: IInternalEvent) => {
        // Check is activated. This will prevent auto reconnects from triggering the resolve
        if (!isActivated) return;

        if (error) {
          resolve(false);
        }

        const { chainId, accounts } = payload.params[0];
        const address = accounts[0];

        console.log({ chainId, address, accounts });

        this.chainId = chainId;
        this.currentAddress = address;

        resolve(true);
      });

      this.walletConnect.on('session_update', (error, payload) => {
        if (error) {
          throw error;
        }

        // Get updated accounts and chainId
        const { accounts, chainId } = payload.params[0];

        console.log({ accounts, chainId });

        // Check if the address has changed and update it + call the appropriate callback
        if (accounts[0] !== this.currentAddress) {
          this.currentAddress = accounts[0];
          this.onAddressChangeCallback?.(accounts[0]);
        }

        // Check if the chainId has changed and update it + call the appropriate callback
        if (chainId !== this.chainId) {
          this.chainId = chainId;
          this.onChainChangeCallback?.(chainId);
        }
      });

      this.walletConnect.on('disconnect', async (error, payload) => {
        if (error) {
          console.error(error);
        }

        console.log('disconnect', payload);

        // Kill the walletConnect instance
        await this.walletConnect.killSession();

        // Delete the localstorage session
        window.localStorage.removeItem('walletconnect');

        // Delete connector
        this.walletConnect = null;
      });

      // create new session
      console.log('create new session', { walletConnect: this.walletConnect });

      // NOTE: this will trigger the modal and the event listener callbacks
      isActivated = true;
      // if the session is active, kill the old session
      if (this.walletConnect.connected) {
        await this.walletConnect.killSession();
      }
      await this.walletConnect.createSession();
    });
  };

  public sign = async (message: string): Promise<string> => {
    if (this.walletConnect === null) {
      throw new Error('WalletConnect not initialized. Activate first.');
    }

    try {
      const result = await this.walletConnect.signPersonalMessage([message, this.currentAddress]);
      return result;
    } catch (e) {
      console.error(e);
      return '';
    }
  };
  public signTypedData = async (msgParams: Record<string, any>, signType?: SignType): Promise<string> => {
    if (this.walletConnect === null) {
      throw new Error('WalletConnect not initialized. Activate first.');
    }

    try {
      let result: string;

      switch (signType) {
        case SignType.SIGN_TYPED_DATA:
        case SignType.SIGN_TYPED_DATA_V1:
          result = await this.walletConnect.signTypedData([this.currentAddress, JSON.stringify(msgParams)]);
          break;
        case SignType.SIGN_TYPED_DATA_V4:
        case SignType.SIGN_TYPED_DATA_V3:
          this.internalRpcId += 1; // Use this as some linters complain about using ++ in a non-loop
          result = await this.walletConnect.sendCustomRequest({
            id: this.internalRpcId,
            jsonrpc: '2.0',
            method: signUtil.signTypeToMethodName(signType),
            params: [this.currentAddress, JSON.stringify(msgParams)],
          });
          break;

        default:
          throw new Error('Unsupported sign type');
      }

      return result;
    } catch (e) {
      console.error(e);
      return '';
    }
  };

  isUnlocked = async (): Promise<boolean> => {
    return true;
  };

  public sendTransaction = async (transaction: ITransactionData): Promise<ITransactionResult> => {
    if (this.walletConnect === null) {
      throw new Error('WalletConnect not initialized. Activate first.');
    }

    const { abi, params } = transaction;
    const contract = this.encodeContract(abi, transaction.to);

    try {
      const txHash = await this.walletConnect.sendTransaction({
        from: this.currentAddress,
        to: transaction.to,
        value: transaction.value,
        gas: transaction.gas,
        gasPrice: transaction.gasPrice,
        data: contract.methods[transaction.functionName](...params).encodeABI(),
        nonce: transaction.nonce,
      });

      if (!txHash) throw new InvalidTransactionReceiptException();

      return txHash;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  public encodeContract = (abi: IABIItem[], contractAddress?: string): IContract => {
    return this.contractEncoder.encodeContract(abi, contractAddress);
  };

  restoreState = async (address: string, chaidId: string | number): Promise<boolean> => {
    return false;
  };

  getBalance = async (): Promise<string> => {
    return '0';
  };
}

export default WalletConnectConnector;
