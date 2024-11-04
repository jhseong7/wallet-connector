# ARCHIVE PROJECT
This is a copy of a project I worked on from 2021~2022. This project is no longer maintained and is outdated. This project is archived here for portfolio purposes only.

# EVM Compatible Abstract Wallet connector

![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?style=for-the-badge&logo=Ethereum&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

## Introduction

This library is a typescript library that provides a abstraction layer to the wallets that are compatible with EVM-based networks.

The library targets to create abstract representations of the wallets so that the user can easily interact with the wallets without having to worry about the underlying implementation.

For example as in pseudocode,

```ts
// NOTE: Example pseudocode. This not represent the real implementation.
const wallet = getWallet('some-wallet-type');

// wait for the user to login to the wallet
await wallet.activate();

// Send a transaction (send "10000")
await wallet.sendTransaction({
  to: '0x...',
  value: 10000,
  gasPrice: '2500000000',
  gasLimit: 21000,
  nonce: 0,
});
```

The goal is to make the users use the same code to interact with the wallets.

## Compatible Wallet lists

- Kaikas (Klaytn)
- Dcent ( ETH/ Klaytn)
- Coinbase (Any RPC)
- Metamask (Any RPC)
- Klip (Klaytn. cypress only)
- Kaikas Mobile
- Wallet Connect (alpha - not stable)

## Extra helper module and usage

The library also offers some helper features:

1. Wallet Event Listener (class)
2. Wallet Connector Selector
3. Wallet Manager (class)

All of the classes are singleton objects, and can be accessed through the `getInstance()` method.

### Wallet Event Listener

The library provides a simple way to listen to events from the wallet connector system. Currently (version 1) event are only emitted by the `Wallet Manager` class, but this more events will be added in the future once common event specification is defined.

The current event types are as follows:

```ts
enum WalletConnectorEventType {
  WALLET_CONNECT,
  WALLET_DISCONNECT,

  // Wallet Events
  WALLET_LOCKED,
  WALLET_AUTO_CONNECTED,
  WALLET_CHANGE,

  // Change events
  WALLET_CHANGE_ADDRESS,
  WALLET_CHANGE_CHAIN,

  // Error events
  ERROR_WRONG_NETWORK,
  ERROR_AUTO_CONNECT_EXPIRED,

  ERROR_NO_MATCHING_CONNECTOR,
  ERROR_UNLOCK_REQUIRED,

  ERROR_INVALID_WALLET_CONNECTOR,
}
```

The events are emitted on payloads that contain information specific to each event.

```ts
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
```

to listen to events, register a callback function to the WalletEventListener class instance

```ts
import { WalletEventListener } from '@jhseong7/wallet-connector'

const walletEventListener = WalletEventListener.getInstance();

// For all events
walletEventListener.addEventListener('all-event-listener-id', (event: IWalletConnectorEventBase) => {
  console.log(event);
});

// For specific event types
walletEventListener.addEventListenerForEvent(
  'some-event-listener-id',
  new Set([
    WalletConnectorEventType.WALLET_CONNECT,
    WalletConnectorEventType.WALLET_DISCONNECT
    ]),
  (event: AddressChangeEvent
) => {
  console.log(event);
}

// Remove event listener
walletEventListener.removeEventListener('some-event-listener-id');
```

### Wallet Selector (Wallet connector selector)

This module provides a simple way to select a wallet connector.

The module provides 2 ways to select a wallet connector:

1. By wallet connector type: `WalletType` @ `@jhseong7/wallet-connector/dist/interface`
2. By chain type: `ChainType` @ `@jhseong7/wallet-connector/dist/interface`

To get a wallet connector using the wallet selector

```ts
import { WalletSelector } from '@jhseong7/wallet-connector';
import { WalletType, IWalletConnector } from '@jhseong7/wallet-connector/dist/interface';

// Get by wallet type. Will return null if no wallet connector is found.
const metamaskConnector: IWalletConnector = WalletSelector.getByWalletType(WalletType.METAMASK);

// Get list of wallet types by chain type. Will return empty array if no wallet connector is found.
const walletTypeList: WalletType[] = WalletSelector.getWalletListOfChainType(ChainType.ETHEREUM);
```

### Wallet Manager

The wallet manager is a singleton state machine that manages wallet connect to the DApp.

The manager only allows one wallet connector to be active at a time. And will automatically respond to wallet events (such as chain change and address change) and serves callback options for the client to utilize.


