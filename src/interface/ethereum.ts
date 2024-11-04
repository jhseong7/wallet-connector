import { IpcProvider } from 'web3-core';

interface Ethereum extends IpcProvider {
  // eslint-disable-next-line
  request: (data: { method: string; data?: any[]; params?: any[] }) => Promise<any>;
  on: (event: string, callback: (error: any, result: any) => void) => void;

  // networkVersion: string | number;
  chainId: string | number;
  selectedAddress: string | undefined;
}

interface EthereumInjectedWindow extends Window {
  ethereum?: Ethereum;
}

export type { Ethereum, EthereumInjectedWindow };
