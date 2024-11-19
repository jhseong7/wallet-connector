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


# Architecture

## Background Knowledge

Crypto wallets are application/services that provide a way to interact with the blockchain, hiding sensitive informations such as private keys that are essential to create transactions/sign messages.

Typical EVM-compatitable crypto wallets take the form of a **provider**. Which is a service/application that takes "requests" from the user and takes "actions". Actions include:

1. sending transactions to the blockchain
2. returning signed messages
3. etc.

![Typical wallet flow](./docs/diagrams//wallet-flow.png)

The typical flow is identical for all EVM-compatiable wallets but the insides have some variations.

For the most significant and common case (e.g. Metamask), JsonRPC is used to interact with the wallet.

![Metamask diagram](https://miro.medium.com/max/1352/1*ronMtzhop4EL70l8lItDGA.png)

[Source](https://betterprogramming.pub/build-your-first-dapp-with-web3-js-9a7306d16a61) from the [Better Programming](https://betterprogramming.pub/) blog.

The DApp (as a form of webapp) triggers/sends a JSONRPC request to the wallet through an interface usually given by the wallet.

The interface ususally takes form of the following kinds:

- A Browser extension that provides a JSONRPC interface
- In-app browser with built-in provider

By using the provided JSONRPC interface, the DApp can utillize the wallet to send transactions, sign messages, etc.

Another form of wallets are server-side wallets. Example of this case is Klip.

Klip processes all transactions on the server-side, concealing the private keys and logic behind the transactions. In the case of Klip, even the calls are typical REST API calls. This greatly simplifies the complexity for the DApp when using the wallet, but also limits the functionality of the wallet we can interact with.

The architecture of Klip is as follows:

![Klip wallet flow](./docs/diagrams/klip-flow.png)

## Designing the architecture

### Wallet feature abstraction

The first step is to create an abstraction layer for the wallet.

Most wallets for Ethereum-compatible networks work with providers that follow the [ERC-1193](https://eips.ethereum.org/EIPS/eip-1193) specification. Klaytn network wallets, such as Kaikas, although not fully ERC-1193 compatible, are almost compatible since it is based on the same underlying technology.

The only outlier is Klip. Which is a fully server-side wallet, doesn't have any kind of RPC Provider interface, thus not compatible with the ERC-1193 specification.

Even so, although they have completely different call-flows, we can derive an abstract interface enough to such level where typical DApps use.

...

### Implementation stategy through inheritance and augmentation

The implementation of the abstract layer for every single type of wallet has a lot of boilerplating. This is because most wallets follow the ERC-1193 specification, thus having a `ethereum` provider and using `web3.js` as the helper library.

For example, code to send a transaction for a Metamask wallet and Coinbase wallet is as follows:

> Metamask

```ts
// Metamask wallet
import Web3 from 'web3';

const { ethereum } = window;

const web3 = new Web3(ethereum);

web3.eth.sendTransaction({
  to: '0x...',
  value: 10000,
  gasPrice: '2500000000',
  gasLimit: 21000,
});
```

> Coinbase

```ts
// Coinbase wallet
import Web3 from 'web3';
import CoinbaseWalletSDK from '@coinbase/wallet-sdk';

// Create a provider with the sdk
const coinbaseWallet = new CoinbaseWalletSDK({
  appName: APP_NAME,
  appLogoUrl: APP_LOGO_URL,
  darkMode: false,
});
const coinbaseProvider = coinbaseWallet.makeWeb3Provider(JSONRPC_URL, CHAIN_ID);

const web3 = new Web3(ethereum);

web3.eth.sendTransaction({
  to: '0x...',
  value: 10000,
  gasPrice: '2500000000',
  gasLimit: 21000,
});
```

As seen, only the `ethereum` provider is different for each wallet, and other web3.js calls a identical.

Klaytn provider cases are almost identical as well:

```ts
// Kaikas/Dcent example
import Caver from 'caver';

const { klaytn } = window;

const caver = new Caver(klaytn);

caver.klay.sendTransaction({
  to: '0x...',
  value: 10000,
  gasPrice: '2500000000',
  gasLimit: 21000,
});
```

Thus we can factorize the implementation logics for groups of wallet that share a similar logic in common:

1. Ethereum provider based wallets
2. Klaytn provider based wallets
3. Klip

### Extra interfaces for different wallet formats

Some wallets require different flows to interact with its features. For example, Klip requires the user to direct to a deeplink to trigger an in-app flow, Metamask for mobile devices require the user to route to a deeplink to open the in-app web browser (with a ERC-1193 provider pre-injected).

For cases of accessing mobile wallets from desktop browsers (Walletconnect, Klip), QR Codes are used to trigger a deeplink to the mobile wallet.

These needs are handled by extra interfaces, augmenting the base walletconnector interface.

Examples of these interfaces are:

- IQRConnector
  - interface for wallets that require QR codes to be scanned (for TX or for signing)
  - e.g. for login, TX) Klip, Wallet Connect
  - e.g. for opening in-app browser) Metamask, Dcent,
- IDeepLinkConnector
  - Interface for wallets that utilize deep links to trigger in-app flows
  - e.g. for login, TX) Klip
  - e.g. for opening in-app browser in mobile) Metamask, Dcent,

## Basic class structure (simplified)

Parts of the code are simplified/omitted to make the inheritance structure more clear.

```mermaid
classDiagram
  IWalletConnector <|-- EthereumConnector : implements
  IWalletConnector <|-- KlaytnConnector : implements

  IWalletConnector <|-- KlipConnector : implements
  IQRConnector <|-- KlipConnector : implements
  IDeepLinkConnector <|-- KlipConnector : implements


  KlaytnConnector o-- KaikasConnector : extends
  IExtensionConnector o-- KaikasConnector : implements

  EthereumConnector o-- MetamaskConnector : extends

  EthereumConnector o-- CoinbaseConnector : extends

  EthereumConnector o-- DcentEthereumConnector : extends



  class IWalletConnector {
    <<interface>>
    + chainId
    + currentAddress

    + activate()
    + sign(message)
    + sendTransaction(transactionData)
    + encodeContract(abi, contractAddress)
  }

  class IQRConnector {
    <<interface>>
    + qrCode

    + setQrCodeSetCallback(callback)
  }

  class IDeepLinkConnector {
    <<interface>>
    + deeplink

    + setDeeplinkSetCallback(callback)
  }

  class IExtensionConnector {
    <<interface>>
    + hasExtension()
    + getInstallLink()
  }


  class EthereumConnector {
    # web3Inst
    # ethereum

  }

  class KlaytnConnector {
    + caverInst
    + klaytn

  }

  class CoinbaseConnector {
    + coinbaseProvider

  }
```


