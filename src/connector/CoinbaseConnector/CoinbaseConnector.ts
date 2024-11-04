import { Ethereum } from '../../interface/ethereum';
import CoinbaseWalletSDK from '@coinbase/wallet-sdk';
import config from '../../config';
import EthereumConnector from '../EthereumConnector';

// The coinbase wallet only swaps the
class CoinbaseConnector extends EthereumConnector {
  constructor() {
    super();

    const APP_NAME = config.appName;
    const APP_LOGO_URL = config.appLogoUrl;
    const JSONRPC_URL = config.jsonRpcUrl;
    const CHAIN_ID = config.chainId;

    const coinbaseWallet = new CoinbaseWalletSDK({
      appName: APP_NAME,
      appLogoUrl: APP_LOGO_URL,
      darkMode: false,
    });

    const coinbaseProvider = coinbaseWallet.makeWeb3Provider(JSONRPC_URL, CHAIN_ID);

    // The coinbase provider acts as a ethereum provider for the coinbase wallet
    this.ethereum = coinbaseProvider as unknown as Ethereum;
  }

  // Static singleton getter
  public static getInstance(): CoinbaseConnector {
    if (!CoinbaseConnector.instance) {
      CoinbaseConnector.instance = new CoinbaseConnector();
    }
    return CoinbaseConnector.instance;
  }
}

export default CoinbaseConnector;
