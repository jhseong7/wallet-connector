import Web3 from 'web3';

import BaseChangeEventHandler from '../../connector/BaseImplementation/BaseChangeEventHandler';
import Web3ContractEncoder from '../../contract/Web3ContractEncoder';
import { SignType } from '../../enum';
import {
  InvalidTransactionReceiptException,
  TransactionException,
  TransactionExceptionType,
} from '../../exception/transaction';
import { IABIItem } from '../../interface/abi';
import { IContractEncoder } from '../../interface/contract';
import { Ethereum, EthereumInjectedWindow } from '../../interface/ethereum';
import { ITransactionData, ITransactionResult } from '../../interface/transaction';
import { IWalletConnector } from '../../interface/walletconnector';
import { signUtil } from '../../util/sign';

class EthereumConnector extends BaseChangeEventHandler implements IWalletConnector {
  private web3Inst: Web3 | null = null;

  public currentAddress: string;

  public chainId: string | number | undefined;

  protected static instance: EthereumConnector | null = null;

  protected contractEncoder: IContractEncoder;

  protected ethereum: Ethereum | null = null;

  constructor() {
    super();

    this.web3Inst = null;
    this.currentAddress = '';
    this.chainId = undefined;
    this.onAddressChangeCallback = null;
    this.onChainChangeCallback = null;

    const { ethereum } = window as EthereumInjectedWindow;
    if (ethereum) this.ethereum = ethereum;

    this.contractEncoder = Web3ContractEncoder.create(ethereum);
  }

  // eslint-disable-next-line class-methods-use-this
  public isUnlocked = async (): Promise<boolean | null> => {
    return null;
  };

  // Static singleton getter
  public static getInstance(): EthereumConnector {
    if (!EthereumConnector.instance) {
      EthereumConnector.instance = new EthereumConnector();
    }
    return EthereumConnector.instance;
  }

  public static create(): EthereumConnector {
    return new EthereumConnector();
  }

  public activate = async () => {
    if (!this.ethereum) return false;

    // Try to enable the Ethereum wallet
    try {
      const addressList = await this.ethereum.request({ method: 'eth_requestAccounts' });

      if (addressList.length === 0) return false;

      const [address] = addressList;
      this.setCurrentAddress(address);

      // eslint-disable-next-line
      this.web3Inst = new Web3(this.ethereum as any); // disable lint for this line

      this.setChainId(this.ethereum.chainId);

      // Set callback providers for account and network version
      this.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) return;
        const [account] = accounts;
        this.setCurrentAddress(account);
      });

      this.ethereum.on('chainChanged', (chainId: string | number) => {
        this.setChainId(chainId);
      });
    } catch (e) {
      // throw new Error('Failed to enable klaytn provider');
      return false;
    }

    return true;
  };

  public sign = async (message: string) => {
    if (!this.ethereum) {
      throw new Error('Failed to sign message: Ethereum provider is not available');
    }

    try {
      const signature = (await this.ethereum.request({
        method: 'personal_sign',
        params: [message.toString(), this.currentAddress],
      })) as string;

      return signature;
    } catch (e) {
      return '';
    }
  };

  public signTypedData = async (
    msgParams: Record<string, any>,
    signType: SignType = SignType.SIGN_TYPED_DATA_V1
  ): Promise<string> => {
    if (!this.ethereum) {
      throw new Error('Failed to sign message: Ethereum provider is not available');
    }

    try {
      const message = JSON.stringify(msgParams);

      const signature = (await this.ethereum.request({
        method: signUtil.signTypeToMethodName(signType),
        params: [this.currentAddress, message.toString()],
      })) as string;

      return signature;
    } catch (e) {
      return '';
    }
  };

  public sendTransaction = async (transaction: ITransactionData) => {
    const { abi, params } = transaction;
    const contract = this.encodeContract(abi, transaction.to);

    // NOTE: https://stackoverflow.com/questions/68926306/avoid-this-gas-fee-has-been-suggested-by-message-in-metamask-using-web3
    try {
      const receipt = await this.web3Inst?.eth.sendTransaction({
        from: this.currentAddress,
        to: transaction.to,
        value: transaction.value,
        gas: transaction.gas,
        gasPrice: transaction.gasPrice,
        // NOTE: https://stackoverflow.com/questions/68926306/avoid-this-gas-fee-has-been-suggested-by-message-in-metamask-using-web3
        maxFeePerGas: transaction.maxFeePerGas,
        maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
        data: contract.methods[transaction.functionName](...params).encodeABI(),
        nonce: transaction.nonce,
        chainId: transaction.chainId,
        hardfork: transaction.hardfork,
        common: transaction.common,
      });

      if (!receipt) throw new InvalidTransactionReceiptException();

      const result: ITransactionResult = {
        transactionHash: receipt.transactionHash,
        receipt: {
          status: receipt.status ? '1' : '0',
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
    if (!this.ethereum) return false;

    // eslint-disable-next-line
    this.web3Inst = new Web3(this.ethereum as any);

    this.setCurrentAddress(address);
    this.setChainId(chaidId);

    return true;
  };

  public getBalance = async (): Promise<string> => {
    if (!this.web3Inst) return null;

    try {
      const rawBalance = await this.web3Inst.eth.getBalance(this.currentAddress);
      return this.web3Inst.utils.toBN(rawBalance).toString();
    } catch (e) {
      return null;
    }
  };
}

export default EthereumConnector;
