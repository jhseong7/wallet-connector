import CoinbaseConnector from './CoinbaseConnector';
import EthereumConnector from './EthereumConnector';
import KaikasConnector from './KaikasConnector';
import KlaytnConnector from './KlaytnConnector';
import KlipConnector from './KlipConnector';
import MetamaskConnector from './MetamaskConnector';
import KaikasMobileConnector from './KaikasMobileConnector';
import WalletConnectConnector from './WalletConnectConnector';
import { DcentEthereumConnector, DcentKlaytnConnector } from './DcentConnector';

const WalletConnector = {
  CoinbaseConnector,
  EthereumConnector,
  KaikasConnector,
  KlaytnConnector,
  KlipConnector,
  MetamaskConnector,
  DcentEthereumConnector,
  DcentKlaytnConnector,
  KaikasMobileConnector,
  WalletConnectConnector,
};

export default WalletConnector;
