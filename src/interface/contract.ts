import { IABIItem } from './abi';
import { ITransactionContractSendOptions, paramType } from './transaction';

interface IContractMethod {
  encodeABI: () => string;
  call: (options?: ITransactionContractSendOptions, callback?: (data: string) => void) => Promise<string>;
  send: (options: ITransactionContractSendOptions, callback?: (data: string) => void) => Promise<string>;
}

interface IContract {
  methods: {
    [functionName: string]: (...args: (paramType | paramType[])[]) => IContractMethod;
  };
}

interface IContractEncoder {
  encodeContract: (abi: IABIItem[], contractAddress?: string) => IContract;
}

export type { IContract, IContractEncoder };
