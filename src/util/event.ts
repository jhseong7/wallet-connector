import { IWalletConnectorEventBase } from 'interface/event';
import { WalletConnectorEventType } from '../enum/event';
import { WalletEventListener } from '../event';

// Shorthand to dispatch event to event listener:
const dispatchEvent = (eventType: WalletConnectorEventType, payload?: IWalletConnectorEventBase) => {
  // If no explicit payload is provided, use the default one:
  WalletEventListener.dispatchEvent(eventType, payload ? payload : { type: eventType });
};

export { dispatchEvent };
