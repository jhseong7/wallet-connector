import { TransactionReceipt as CaverTransactionReceipt } from 'caver-js';
import { TransactionReceipt as Web3TransactionReceipt } from 'web3-core';
import { IABIItem } from './abi';

export type paramType = string | number | boolean;
interface ITransactionData {
  to?: string;
  value?: string | number;
  gas?: number | string;
  gasPrice?: string | number;
  functionName: string;
  params: (paramType | paramType[])[];
  abi: IABIItem[]; // ABI of the current transaction
  nonce?: number;
  chainId?: number;
  hardfork?: string;

  // Dynamic gas price field (if supported)
  maxFeePerGas?: string | number | null;
  maxPriorityFeePerGas?: string | number | null;

  // eslint-disable-next-line
  common?: any;
}

interface ITransactionContractSendOptions {
  from: string;
  gas?: number | string;
  gasPrice?: string | number;
  value?: string | number;
}

interface ITransactionReceipt {
  status: string;
  transactionHash: string;
  transactionIndex: number | string;
  blockHash: string;
  blockNumber: number | string;
  from: string;
  to: string;
  contractAddress?: string;
  gasUsed: number | string;
}

interface ITransactionResult {
  transactionHash: string;
  receipt: ITransactionReceipt;
  nativeReceipt: CaverTransactionReceipt | Web3TransactionReceipt; // The native receipt of the transaction from the provider object
}

export { ITransactionData, ITransactionResult, ITransactionReceipt, ITransactionContractSendOptions };
