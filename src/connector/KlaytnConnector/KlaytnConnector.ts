import Caver, { IpcProvider } from 'caver-js';

import BaseChangeEventHandler from '../../connector/BaseImplementation/BaseChangeEventHandler';
import CaverContractEncoder from '../../contract/CaverContractEncoder';
import { SignType } from '../../enum';
import {
  InvalidTransactionReceiptException,
  TransactionException,
  TransactionExceptionType,
} from '../../exception/transaction';
import { IABIItem } from '../../interface/abi';
import { IContractEncoder } from '../../interface/contract';
import { Klaytn, KlaytnInjectedWindow } from '../../interface/klaytn';
import { ITransactionData, ITransactionResult } from '../../interface/transaction';
import { IWalletConnector } from '../../interface/walletconnector';
import { signUtil } from '../../util/sign';

class KlaytnConnector extends BaseChangeEventHandler implements IWalletConnector {
  // Public
  public currentAddress: string;

  public chainId: string | number | undefined;

  // protected
  protected caverInst: Caver | null = null;

  protected static instance: KlaytnConnector | null = null;

  protected contractEncoder: IContractEncoder;

  protected klaytn: Klaytn | null = null;

  constructor() {
    super();

    this.caverInst = null;
    this.currentAddress = '';
    this.chainId = undefined;
    this.onAddressChangeCallback = null;
    this.onChainChangeCallback = null;

    // Create contract encoder with klaytn. the klaytn instance is a IpcProvider
    const { klaytn } = window as KlaytnInjectedWindow;
    this.klaytn = klaytn;
    this.contractEncoder = CaverContractEncoder.create(this.klaytn as unknown as IpcProvider);
  }

  // Static singleton getter
  public static getInstance(): KlaytnConnector {
    if (!KlaytnConnector.instance) {
      KlaytnConnector.instance = new KlaytnConnector();
    }
    return KlaytnConnector.instance;
  }

  // eslint-disable-next-line class-methods-use-this
  public isUnlocked = async (): Promise<boolean | null> => {
    return null;
  };

  public static create(): KlaytnConnector {
    return new KlaytnConnector();
  }

  public activate = async () => {
    if (!this.klaytn) return false;

    // Try to enable the Klaytn wallet
    try {
      const addressList = await this.klaytn.enable(); //

      // Get and set address
      if (addressList.length === 0) return false;
      const [address] = addressList;
      this.setCurrentAddress(address);

      // eslint-disable-next-line
      this.caverInst = new Caver(this.klaytn as any); // disable lint for this line

      this.setChainId(this.klaytn.networkVersion);

      // Set callback providers for account and network version
      this.klaytn.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) return;
        const [account] = accounts;
        this.setCurrentAddress(account);
      });

      this.klaytn.on('networkChanged', (chainId: string | number) => {
        this.setChainId(chainId);
      });
    } catch (e) {
      // throw new Error('Failed to enable klaytn provider');
      return false;
    }

    return true;
  };

  public sign = async (message: string) => {
    if (!this.caverInst) {
      throw new Error('Caver instance is not initialized');
    }

    try {
      const signature = await this.caverInst.rpc.klay.sign(this.currentAddress, message);

      return signature;
    } catch (e) {
      // On any sign error
      throw e;
    }
  };

  public signTypedData = async (
    msgParams: Record<string, any>,
    signType: SignType = SignType.SIGN_TYPED_DATA_V1
  ): Promise<string> => {
    if (!this.klaytn) {
      throw new Error('Failed to sign message: Klaytn provider is not available');
    }

    try {
      const message = JSON.stringify(msgParams);
      return new Promise<string>((resolve, reject) => {
        this.klaytn.sendAsync(
          {
            method: signUtil.signTypeToMethodName(signType),
            params: [this.currentAddress, message],
            from: this.currentAddress,
          },
          (err, result) => {
            if (err) {
              reject(err);
            }
            resolve(result.result);
          }
        );
      });
    } catch (e) {
      throw e;
    }
  };

  public sendTransaction = async (transaction: ITransactionData) => {
    const { abi, params } = transaction;
    const contract = this.encodeContract(abi, transaction.to);

    try {
      const receipt = await this.caverInst?.rpc.klay.sendTransaction({
        from: this.currentAddress,
        to: transaction.to,
        value: transaction.value,
        gas: transaction.gas,
        gasPrice: transaction.gasPrice,
        data: contract.methods[transaction.functionName](...params).encodeABI(),
      });

      if (!receipt) throw new InvalidTransactionReceiptException();

      const result: ITransactionResult = {
        transactionHash: receipt.transactionHash,
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

      return result;
    } catch (e) {
      if (e instanceof InvalidTransactionReceiptException) {
        throw e;
      }

      // TODO: Add additional error handling for different types of wallet errors
      throw new TransactionException(TransactionExceptionType.GENERAL, e);
    }
  };

  public encodeContract = (abi: IABIItem[], contractAddress?: string) => {
    return this.contractEncoder.encodeContract(abi, contractAddress);
  };

  private setCurrentAddress = (address: string) => {
    this.currentAddress = address;
    if (this.onAddressChangeCallback) this.onAddressChangeCallback(this.currentAddress);
  };

  private setChainId = (chainId: string | number) => {
    this.chainId = chainId;
    if (this.onChainChangeCallback) this.onChainChangeCallback(this.chainId);
  };

  public restoreState = async (address: string, chaidId: string | number) => {
    // Set the caver instance
    if (!this.klaytn) return false;

    // eslint-disable-next-line
    this.caverInst = new Caver(this.klaytn as any); // disable lint for this line
    this.setCurrentAddress(address);
    this.setChainId(chaidId);

    return true;
  };

  public getBalance = async (): Promise<string> => {
    if (!this.caverInst) return null;

    try {
      const balance = await this.caverInst.klay.getBalance(this.currentAddress);
      return this.caverInst.utils.toBN(balance).toString();
    } catch (e) {
      return null;
    }
  };
}

export default KlaytnConnector;
