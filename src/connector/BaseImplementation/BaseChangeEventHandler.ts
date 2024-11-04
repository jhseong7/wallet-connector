import { IWalletStateChangeHandler } from '../../interface/walletconnector';

class BaseChangeEventHandler implements IWalletStateChangeHandler {
  protected onAddressChangeCallback: ((address: string) => void) | null;
  protected onChainChangeCallback: ((chainId: string | number) => void) | null;

  public setOnAddressChange = (callback: (address: string) => void) => {
    this.onAddressChangeCallback = callback;
  };

  public setOnChainChange = (callback: (chainId: string | number) => void) => {
    this.onChainChangeCallback = callback;
  };
}

export default BaseChangeEventHandler;
