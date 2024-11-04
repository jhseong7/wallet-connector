import { ChainType, WalletType } from '../enum';
import { IWalletConnector } from '../interface';
import { chainTypeToWalletTypeSetMap, walletMap } from './walletmap';

const getByWalletType = (walletType: WalletType): IWalletConnector | null => {
  if (!walletMap.has(walletType)) {
    return null;
  }

  return walletMap.get(walletType).instantiator();
};

const getWalletListOfChainType = (chainType: ChainType): WalletType[] => {
  if (!chainTypeToWalletTypeSetMap.has(chainType)) {
    return [];
  }

  return Array.from(chainTypeToWalletTypeSetMap.get(chainType));
};

const WalletSelector = { getByWalletType, getWalletListOfChainType };

export { WalletSelector };
