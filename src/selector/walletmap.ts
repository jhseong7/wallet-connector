// Wallet type <==> WalletConnector pairs

import ChainType from '../enum/ChainType';
import WalletType from '../enum/WalletType';
import { IWalletConnector } from '../interface/walletconnector';
import CoinbaseConnector from '../connector/CoinbaseConnector';
import KaikasConnector from '../connector/KaikasConnector';
import KlaytnConnector from '../connector/KlaytnConnector';
import KlipConnector from '../connector/KlipConnector';
import MetamaskConnector from '../connector/MetamaskConnector';
import { DcentEthereumConnector, DcentKlaytnConnector } from '../connector/DcentConnector';
import KaikasMobileConnector from '../connector/KaikasMobileConnector';
import WalletConnectConnector from '../connector/WalletConnectConnector';

type WalletConnectorInstantiator = () => IWalletConnector;

// Wallet data interface: saves data that will be used to build the wallet map
interface WalletData {
  instantiator: WalletConnectorInstantiator;
  supportedChains: Set<ChainType>;
}

// Map of wallet datas
const walletMap: Map<WalletType, WalletData> = new Map();

// Kaikas
walletMap.set(WalletType.KAIKAS, {
  instantiator: KaikasConnector.create,
  supportedChains: new Set([ChainType.KLAYTN, ChainType.KLAYTN_TESTNET]),
});

// Klip
walletMap.set(WalletType.KLIP, {
  instantiator: KlipConnector.create,
  supportedChains: new Set([ChainType.KLAYTN, ChainType.ETHEREUM]),
});

// Metamask
walletMap.set(WalletType.METAMASK, {
  instantiator: MetamaskConnector.create,
  supportedChains: new Set([ChainType.KLAYTN, ChainType.KLAYTN_TESTNET, ChainType.ETHEREUM, ChainType.POLYGON]),
});

// Coinbase
walletMap.set(WalletType.COINBASE, {
  instantiator: CoinbaseConnector.create,
  supportedChains: new Set([ChainType.KLAYTN, ChainType.KLAYTN_TESTNET, ChainType.ETHEREUM, ChainType.POLYGON]),
});

// Dcent - (Ethereum and Klaytn)
walletMap.set(WalletType.DCENT_ETHEREUM, {
  instantiator: DcentEthereumConnector.create,
  supportedChains: new Set([ChainType.ETHEREUM, ChainType.POLYGON]),
});

walletMap.set(WalletType.DCENT_KLAYTN, {
  instantiator: DcentKlaytnConnector.create,
  supportedChains: new Set([ChainType.KLAYTN, ChainType.KLAYTN_TESTNET]),
});

// Kaikas mobile (Klutch)
walletMap.set(WalletType.KAIKAS_MOBILE, {
  instantiator: KaikasMobileConnector.create,
  supportedChains: new Set([ChainType.KLAYTN, ChainType.KLAYTN_TESTNET]),
});

// WalletConnect
walletMap.set(WalletType.WALLET_CONNECT, {
  instantiator: WalletConnectConnector.create,
  supportedChains: new Set([ChainType.KLAYTN, ChainType.KLAYTN_TESTNET, ChainType.ETHEREUM, ChainType.POLYGON]),
});

// Build a map so we can get the wallettype from the chaintype
const chainTypeToWalletTypeSetMap: Map<ChainType, Set<WalletType>> = new Map();
walletMap.forEach((value, walletType) => {
  // For each of the supported chains, add the wallet type to the set
  const { supportedChains } = value;

  supportedChains.forEach((chainType) => {
    let currentWalletSet = chainTypeToWalletTypeSetMap.get(chainType);

    // If not in set
    if (!currentWalletSet) currentWalletSet = new Set();

    // Add the current wallet to the chain
    currentWalletSet.add(walletType);

    // update the current wallet set
    chainTypeToWalletTypeSetMap.set(chainType, currentWalletSet);
  });
});

export { chainTypeToWalletTypeSetMap, walletMap };
