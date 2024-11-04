// import { IpcProvider } from 'caver-js';

interface Klaytn {
  enable: () => Promise<string[]>;
  on: (event: string, callback: (error: any, result: any) => void) => void;
  networkVersion: string | number;
  selectedAddress: string | undefined;
  sendAsync: (request: any, callback: (error: any, result: any) => void) => Promise<void>;
}

interface KlaytnInjectedWindow extends Window {
  klaytn?: Klaytn;
}

export type { Klaytn, KlaytnInjectedWindow };
