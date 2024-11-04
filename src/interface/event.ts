import { WalletConnectorEventType } from 'enum/event';

/**
 * The base event type for all events emitted by the wallet connector library.
 */
interface IWalletConnectorEventBase {
  type: WalletConnectorEventType;
}

export { IWalletConnectorEventBase };
