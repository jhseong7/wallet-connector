import { WalletConnectorEventType } from 'enum/event';
import { IWalletConnectorEventBase } from 'interface/event';

type WalletEventListenerCallback = (eventType: WalletConnectorEventType, payload: IWalletConnectorEventBase) => void;

/**
 * WalletEventListener
 *
 * Class to handler events that are from the wallet connector library.
 * Any events emitted by the connector library will be handled by this class.
 *
 * Designed to be used as a singleton object. (the constructor is private)
 *
 * Users can register their own event listener to handle events from the connector library.
 *
 * Events carry any payloads, so using the correct type of the payload is crutial.
 *
 * Payloads are defined in `event-implementation.ts`.
 *
 * All payloads are defined with classes so use instanceof to check the type of the payload.
 */
class WalletEventListener {
  private static instance: WalletEventListener = new WalletEventListener();
  private eventObservers: Map<string, WalletEventListenerCallback> = new Map();

  public static getInstance(): WalletEventListener {
    return this.instance;
  }

  /**
   * Add an event listener for all events
   * @param listenerId id of the listener to add (must be unique, if not, it will be overwritten)
   * @param listener the listener callback function to add
   */
  public static addEventListener(listenerId: string, listener: WalletEventListenerCallback) {
    WalletEventListener.getInstance().eventObservers.set(listenerId, listener);
  }

  /**
   * Add a event listener for specific list of events
   * @param listenerId id of the listener to add (must be unique, if not, it will be overwritten)
   * @param eventTypes list of events to listen to
   * @param listener the listener callback function to add
   */
  public static addEventListenerForEvent(
    listenerId: string,
    eventTypes: Set<WalletConnectorEventType>,
    listener: WalletEventListenerCallback
  ) {
    // Create a function to filter only the designated events
    const filteredListener = (type: WalletConnectorEventType, payload: IWalletConnectorEventBase) => {
      // If the event type is not in the Set, return;
      if (!eventTypes.has(type)) return;

      listener(type, payload);
    };

    WalletEventListener.getInstance().eventObservers.set(listenerId, filteredListener);
  }

  /**
   * Deregister the event listener with the given id
   * @param listenerId id of the listener to remove
   */
  public static removeEventListener(listenerId: string) {
    WalletEventListener.getInstance().eventObservers.delete(listenerId);
  }

  /**
   * Dispatch an event to all event listeners registered to the instance
   * @param eventType type of event to dispatch
   * @param payload payload of the event.
   */
  public static dispatchEvent(eventType: WalletConnectorEventType, payload: IWalletConnectorEventBase) {
    // For all listeners, call the callback function
    WalletEventListener.getInstance().eventObservers.forEach((callback) => {
      callback(eventType, payload);
    });
  }
}

export default WalletEventListener;
