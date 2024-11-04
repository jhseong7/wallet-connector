import { makeAutoObservable } from 'mobx';
import ChainType from '../enum/ChainType';
import WalletType from '../enum/WalletType';
import { IWalletConnector, IWalletState } from '../interface/walletconnector';
import { sessionStorageHelper } from '../util/session';
import { IWalletManagerOptions } from '../interface/manager';
import { dispatchEvent } from '../util/event';
import { WalletConnectorEventType } from '../enum/event';
import { WalletSelector } from '../selector';
import { AddressChangeEvent, ChainChangeEvent } from '../event/event-implementation';
import { Config } from '../config';

const MAX_WALLET_CONNECTION_TIME = {
  hour: 6,
};

const WALLET_STATE_KEY = 'wallet-connector-wallet-state';

/**
 * WalletManager class
 *
 * This class is used to manage the wallet connection.
 * This class is must only be used with the singleton instance to avoid multiwallet connections.
 * If you want to use multiwallet connection, an careful management is required. (not recommended)
 */
class WalletManager {
  // the connected Connector instance
  walletConnector: IWalletConnector | null = null;

  // Wallet type of the connected wallet
  walletType: WalletType;

  // Chain type of the connected wallet
  chainType: ChainType;

  // Current address of the connected wallet
  currentAddress: string;

  // Current chain id of the connected wallet
  chainId: string | number;

  // Observers for address change event (for logics external to the wallet manager)
  onAddressChangeObservers: Map<string, (address: string) => void>;

  onNetworkChangeObservers: Map<string, (chainId: string | number) => void>;

  onWalletChangeObservers: Map<string, (walletType: WalletType) => void>;

  // Target Chain ID. This will be used to determine if the wallet is connected to the target chain.
  targetChainId: number | undefined;

  // Option
  private options: IWalletManagerOptions;

  // variable to save the singleton object
  private static instance: WalletManager | null = null;

  /**
   * Constructor
   * @param options Options to initialize the WalletManager
   */
  constructor(options: IWalletManagerOptions) {
    this.walletType = WalletType.NONE;
    this.chainType = ChainType.NONE;
    this.currentAddress = '';
    this.chainId = '';
    this.onAddressChangeObservers = new Map();
    this.onNetworkChangeObservers = new Map();
    this.onWalletChangeObservers = new Map();

    this.targetChainId = options.targetChainId;

    if (options.walletAutoConnect === true) {
      const result = this.restoreWalletState();
      if (!result) this.clearWalletState();
    }

    if (options.useAsMobxStore === true) makeAutoObservable(this);

    this.options = options;

    // Initialize the config object
    Config.getInstance().initialize({ chainId: options.targetChainId, ...options });
  }

  /* Static methods used to manupulate the singleton object */

  /**
   * Gets the singleton object of the WalletManager
   * @returns the singleton object
   */
  static getInstance(): WalletManager {
    if (WalletManager.instance === null) {
      throw new Error(
        'WalletManager is not initialized. you must call initialize() first to get instance using the getInstance Method'
      );
    }

    return WalletManager.instance;
  }

  /**
   * Used to initialize the singleton walletmanager with the given options.
   * @param options Options to initialize the WalletManager
   */
  static initialize(options: IWalletManagerOptions) {
    if (WalletManager.instance !== null) {
      throw new Error(
        'WalletManager is already initialized. Only one initialize is allowed to assure a singleton object'
      );
    }

    WalletManager.instance = new WalletManager(options);
  }

  /**
   * Explicitly destroy the singleton object. This is used to reinitialize the singleton object incase of a re-initialization
   */
  static destroy() {
    WalletManager.instance = null;
  }

  /**
   * Explicit call when the wallet is disconnected. (e.g. logout, signout, etc.)
   */
  public disconnectWallet = () => {
    this.walletConnector = null;
    this.resetVariables();
    this.clearWalletState();

    // Emit event
    dispatchEvent(WalletConnectorEventType.WALLET_DISCONNECT);
  };

  /**
   * Reset the variables to default values. don't clear the listeners
   */
  private resetVariables = () => {
    this.walletType = WalletType.NONE;
    this.chainType = ChainType.NONE;
    this.currentAddress = '';
    this.chainId = '';
  };

  /**
   * Set the current wallet connector to use with the manager
   * @param walletConnector Wallet connector instance to set
   */
  public setWalletConnector = (walletConnector: IWalletConnector) => {
    if (!walletConnector) {
      dispatchEvent(WalletConnectorEventType.ERROR_INVALID_WALLET_CONNECTOR);
      throw new Error('Invalid wallet connector');
    }

    if (walletConnector.currentAddress) this.setCurrentAddress(walletConnector.currentAddress);

    if (walletConnector.chainId) this.setChainId(walletConnector.chainId);

    // Set the change listeners
    walletConnector.setOnAddressChange((address) => {
      this.setCurrentAddress(address);
      dispatchEvent(WalletConnectorEventType.WALLET_CHANGE_ADDRESS, new AddressChangeEvent(address));
    });
    walletConnector.setOnChainChange((chainId) => {
      this.setChainId(chainId);
      dispatchEvent(WalletConnectorEventType.WALLET_CHANGE_CHAIN, new ChainChangeEvent(chainId));
    });

    // Emit wallet change to observers
    this.onWalletChangeObservers.forEach((callback) => {
      callback(this.walletType);
    });

    // Emit the wallet change event
    dispatchEvent(WalletConnectorEventType.WALLET_CHANGE);

    // Save the wallet state
    this.saveWalletState();

    // Save wallet connector to the manager
    this.walletConnector = walletConnector;
  };

  /**
   * Explicitly set the current address of the connected wallet. This is not automatically set with the wallet connector.
   * This is because a single wallet connector could reflect multiple wallets.
   * @param walletType Wallet type to set
   */
  public setWalletType = (walletType: WalletType) => {
    this.walletType = walletType;

    // Update wallet state
    this.saveWalletState();
  };

  /**
   * Explicitly set the current address of the connected wallet. This is not automatically set with the wallet connector.
   * This is because the wallet connector is a object that handles the connection to the wallet, not the chain.
   * A single type of wallet connector can be used to connect to multiple chains. (e.g. Metamask, etc.)
   * @param chainType chain type that the wallet was used to connect to
   */
  public setChainType = (chainType: ChainType) => {
    this.chainType = chainType;

    // Update wallet state
    this.saveWalletState();
  };

  /** Deprecated */
  public getCurrentAddress = () => {
    return this.walletConnector?.currentAddress || '';
  };

  // Short hand for wallet status : do not use this for mobx observers (does not work properly)
  public isWalletConnected = () => {
    return this.walletConnector !== null && this.walletConnector.currentAddress && this.walletType !== WalletType.NONE;
  };

  // Register/Deregister address change listeners
  public registerOnAddressChange = (key: string, callback: (address: string) => void) => {
    this.onAddressChangeObservers.set(key, callback);
  };

  public deregisterOnAddressChange = (key: string) => {
    this.onAddressChangeObservers.delete(key);
  };

  // Register/Deregister network change listeners
  public registerOnNetworkChange = (key: string, callback: (chainId: string | number) => void) => {
    this.onNetworkChangeObservers.set(key, callback);
  };

  public deregisterOnNetworkChange = (key: string) => {
    this.onNetworkChangeObservers.delete(key);
  };

  public registerOnWalletChange = (key: string, callback: (walletType: WalletType) => void) => {
    this.onWalletChangeObservers.set(key, callback);
  };

  public deregisterOnWalletChange = (key: string) => {
    this.onWalletChangeObservers.delete(key);
  };

  /* 
    Private methods 
  */

  /**
   * Set the current address of the connected wallet.
   * @param address Address to set
   */
  private setCurrentAddress = (address: string) => {
    this.currentAddress = address;

    // Inform the observers
    this.onAddressChangeObservers.forEach((callback) => {
      callback?.(address);
    });

    // Save the wallet state
    this.saveWalletState();
  };

  /**
   * Set the chain Id to the manager's chainId variable
   * @param chainId Chain id to set
   */
  private setChainId = (chainId: string | number) => {
    this.chainId = chainId;

    // Inform the observers
    this.onNetworkChangeObservers.forEach((callback) => {
      callback?.(chainId);
    });

    // Check the chain and disconnect if not the target chain. If targetChainId is not set, then the auto disconnect will not happen
    if (
      this.options.autoDisconnectOnChainMismatch === true &&
      this.targetChainId &&
      this.targetChainId !== Number(chainId)
    ) {
      // disconnect wallet
      this.disconnectWallet();

      // Emit the wrong network event
      dispatchEvent(WalletConnectorEventType.ERROR_WRONG_NETWORK);
    }

    // Save the wallet state
    this.saveWalletState();
  };

  /**
   * Restores the wallet state to the manager from the sessionstorage
   * @returns result of the wallet state restore (true/false)
   */
  private restoreWalletState = async (): Promise<boolean> => {
    // Get state from session storage
    const { value, hasExpired } = sessionStorageHelper.getWithExpire(WALLET_STATE_KEY);

    // Check is expired
    if (hasExpired) {
      // Emit the expired auto connect event
      dispatchEvent(WalletConnectorEventType.ERROR_AUTO_CONNECT_EXPIRED);

      return false;
    }

    if (!value) return false;

    try {
      const state = JSON.parse(value) as IWalletState;

      // If any of the state is invalid, do not restore
      if (
        !state.address ||
        state.chainId === undefined ||
        state.walletType === undefined ||
        state.chainType === undefined
      )
        return false;

      // Get the wallet connector
      const walletConnector = WalletSelector.getByWalletType(state.walletType);

      // if the connector is not found, do not restore
      if (!walletConnector) {
        dispatchEvent(WalletConnectorEventType.ERROR_NO_MATCHING_CONNECTOR);
        return false;
      }

      // Restore the state of the walletConnector
      const isUnlocked = await walletConnector.isUnlocked();

      // if unlock is supported and the wallet is not unlocked. do not restore
      if (isUnlocked !== null && isUnlocked === false) {
        dispatchEvent(WalletConnectorEventType.ERROR_UNLOCK_REQUIRED);
        return false;
      }

      // Try and restore the state
      const result = await walletConnector.restoreState(state.address, state.chainId);
      if (!result) return false; // Dont inform this case

      // set the restored wallet connector
      this.setWalletConnector(walletConnector);
      this.setChainType(state.chainType);
      this.setWalletType(state.walletType);

      // Emit the auto connected event
      dispatchEvent(WalletConnectorEventType.WALLET_AUTO_CONNECTED);
    } catch (e) {
      return false;
    }

    return true;
  };

  /**
   * Saves the current wallet state to the session storage
   */
  private saveWalletState = () => {
    // Save the wallet state to the session storage
    const state: IWalletState = {
      walletType: this.walletType,
      chainType: this.chainType,
      chainId: this.chainId,
      address: this.currentAddress,
    };

    // Save to sessionStorage with expire 60 sec
    sessionStorageHelper.setWithExpire(WALLET_STATE_KEY, JSON.stringify(state), MAX_WALLET_CONNECTION_TIME);
  };

  /**
   * Remove the wallet state from session storage
   */
  private clearWalletState = () => {
    sessionStorageHelper.removeItem(WALLET_STATE_KEY);
  };
}

export default WalletManager;
