import Caver, { AbiItem, IpcProvider, WebsocketProvider, HttpProvider } from 'caver-js';
import { IABIItem } from '../interface/abi';
import { IContract, IContractEncoder } from '../interface/contract';

type CaverProvider = IpcProvider | HttpProvider | WebsocketProvider | string;
class CaverContractEncoder implements IContractEncoder {
  static instance: CaverContractEncoder | null = null;

  caverInst: Caver | null = null;

  constructor(caverProvider: CaverProvider) {
    this.caverInst = new Caver(caverProvider);
  }

  static create(caverProvider: CaverProvider): CaverContractEncoder {
    return new CaverContractEncoder(caverProvider);
  }

  encodeContract = (abi: IABIItem[], contractAddress?: string | undefined) => {
    // Convert the abstract ABI format to the Web3 format.
    // TODO: Add runtime-type checking to reduce errors
    const contract = this.caverInst?.contract.create(abi as unknown as AbiItem[], contractAddress);

    return contract as unknown as IContract;
  };
}

export default CaverContractEncoder;
