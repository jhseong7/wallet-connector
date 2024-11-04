import Web3 from 'web3';
import { IpcProvider, HttpProvider, WebsocketProvider } from 'web3-core';
import { AbiItem } from 'web3-utils';
import { IABIItem } from '../interface/abi';
import { IContract, IContractEncoder } from '../interface/contract';

type Web3Provider = IpcProvider | HttpProvider | WebsocketProvider;
class Web3ContractEncoder implements IContractEncoder {
  static instance: Web3ContractEncoder | null = null;

  web3Inst: Web3 | null = null;

  constructor(web3Provider: Web3Provider) {
    this.web3Inst = new Web3(web3Provider);
  }

  static create(web3Provider?: Web3Provider): Web3ContractEncoder {
    return new Web3ContractEncoder(web3Provider);
  }

  encodeContract = (abi: IABIItem[], contractAddress?: string | undefined) => {
    // Convert the abstract ABI format to the Web3 format.
    // TODO: Add runtime-type checking to reduce errors
    if (this.web3Inst) {
      const contract = new this.web3Inst.eth.Contract(abi as unknown as AbiItem, contractAddress);

      return contract as unknown as IContract;
    }

    return {} as unknown as IContract;
  };
}

export default Web3ContractEncoder;
