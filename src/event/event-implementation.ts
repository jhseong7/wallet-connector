import { WalletConnectorEventType } from '../enum/event';
import { IWalletConnectorEventBase } from '../interface/event';

/**
 * Event payload to use with the address change event
 */
class AddressChangeEvent implements IWalletConnectorEventBase {
  type: WalletConnectorEventType = WalletConnectorEventType.WALLET_CHANGE_ADDRESS;

  constructor(public address: string) {}
}

/**
 * Event payload to use with the chaid change event
 */
class ChainChangeEvent implements IWalletConnectorEventBase {
  type: WalletConnectorEventType = WalletConnectorEventType.WALLET_CHANGE_CHAIN;

  constructor(public chainId: string | number) {}
}

export { AddressChangeEvent, ChainChangeEvent };
