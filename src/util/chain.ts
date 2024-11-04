import { ChainType } from '../enum';

const getChainId = (chainType: ChainType): number => {
  switch (chainType) {
    case ChainType.ETHEREUM:
      return 1;
    case ChainType.KLAYTN:
      return 8217;
    case ChainType.KLAYTN_TESTNET:
      return 1001;
    case ChainType.POLYGON:
      return 137;
    default:
      return 0;
  }
};

const getChainName = (chainType: ChainType): string => {
  switch (chainType) {
    case ChainType.ETHEREUM:
      return 'Ethereum';
    case ChainType.KLAYTN:
      return 'Klaytn';
    case ChainType.KLAYTN_TESTNET:
      return 'Klaytn Testnet';
    case ChainType.POLYGON:
      return 'Polygon';
    default:
      return '';
  }
};

const ChainUtil = {
  getChainId,
  getChainName,
};

export { ChainUtil };
