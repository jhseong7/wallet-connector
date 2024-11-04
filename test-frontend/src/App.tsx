import React from 'react';
import logo from './logo.svg';
import { ChainUtil, WalletManager, WalletSelector } from '@jhseong7/wallet-connector';
import './App.css';
import { ChainType, SignType, WalletType } from '@jhseong7/wallet-connector/dist/enum';
import { IWalletConnector } from '@jhseong7/wallet-connector/dist/interface';
import { WalletLogic } from './wallet-logic';
import QRCode from 'react-qr-code';
import 'react-toastify/dist/ReactToastify.css';
import { toast, ToastContainer } from 'react-toastify';

WalletManager.initialize({
  appName: 'Wallet Connector Test',
  targetChainId: 8217,
});

WalletManager.getInstance().registerOnNetworkChange('main-network-change-handler', (chain: string | number) => {
  const chainId = getChainId(Number(chain).toString() as ChainType);

  toast(`Network Changed: ${chainId}`);
});

// Set handler for address change
WalletManager.getInstance().registerOnAddressChange('main-address-change-handler', (address: string) => {
  toast(`Address Changed: ${address}`);
});

const getWalletName = (wallet: WalletType) => {
  switch (wallet) {
    case WalletType.KAIKAS:
      return 'Kaikas';
    case WalletType.METAMASK:
      return 'Metamask';
    case WalletType.COINBASE:
      return 'Coinbase';
    case WalletType.DCENT_ETHEREUM:
    case WalletType.DCENT_KLAYTN:
      return 'Dcent';
    case WalletType.KLIP:
      return 'Klip';
    case WalletType.KAIKAS_MOBILE:
      return 'Kaikas Mobile / Klutch';
    case WalletType.WALLET_CONNECT:
      return 'Wallet Connect';
    default:
      return '';
  }
};

const getChainId = (chain: ChainType | undefined) => {
  switch (chain) {
    case ChainType.ETHEREUM:
      return 1;
    case ChainType.KLAYTN:
      return 8217;
    case ChainType.KLAYTN_TESTNET:
      return 1001;
    default:
      return 0;
  }
};

function App() {
  const [walletList, setWalletList] = React.useState<WalletType[]>([]);
  const [chainType, setChainType] = React.useState<ChainType>();
  const [selectedWallet, setSelectedWallet] = React.useState<WalletType>();
  const [signtype, setSigntype] = React.useState<SignType>(SignType.SIGN_TYPED_DATA);

  const [wallet, setWallet] = React.useState<IWalletConnector>();

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const textareaRef2 = React.useRef<HTMLTextAreaElement>(null);

  const [klipqrcode, setKlipqrcode] = React.useState<string>();

  const isQrCodeWallet =
    selectedWallet === WalletType.KLIP ||
    selectedWallet === WalletType.KAIKAS_MOBILE ||
    selectedWallet === WalletType.WALLET_CONNECT;

  React.useEffect(() => {
    const walletList = WalletSelector.getWalletListOfChainType(chainType || ChainType.ETHEREUM);
    console.log({ walletList });

    if (chainType) setWalletList(WalletSelector.getWalletListOfChainType(chainType));
  }, [chainType]);

  React.useEffect(() => {
    if (!selectedWallet) return;

    const wallet = WalletSelector.getByWalletType(selectedWallet);

    if (!wallet) return;

    setWallet(wallet);
  }, [selectedWallet]);

  // On connect handler
  const onConnectClick = React.useCallback(async () => {
    let connector: IWalletConnector | null = null;
    if (chainType && selectedWallet) connector = WalletSelector.getByWalletType(selectedWallet);

    if (connector && selectedWallet) {
      setWallet(connector);
      if (!isQrCodeWallet) WalletLogic.connectWallet(connector, selectedWallet);
      else WalletLogic.connectQrWallet(connector, selectedWallet, setKlipqrcode);
    }
  }, [selectedWallet, chainType, isQrCodeWallet]);

  return (
    <div className='App'>
      <ToastContainer />
      <header className='App-header'>
        {klipqrcode && <QRCode value={klipqrcode} style={{ padding: '2rem', background: 'white' }} />}
        {/* Wallet select */}
        <div className='centered'>
          <span>Choose a Chain</span>
          <select
            name='chain'
            placeholder='select a chain'
            onChange={(e) => setChainType(e.target.value as unknown as ChainType)}
          >
            {Object.values(ChainType).map((value) => (
              <option value={value} key={value}>
                {ChainUtil.getChainName(value as ChainType)}
              </option>
            ))}
          </select>
        </div>

        {/* Wallet list */}
        <div className='centered'>
          <span>Choose a wallet</span>
          <select
            name='wallet'
            placeholder='select a wallet'
            onChange={(e) => setSelectedWallet(e.target.value as unknown as WalletType)}
          >
            {walletList.map((value) => (
              <option value={value} key={value}>
                {getWalletName(value)}
              </option>
            ))}
          </select>
        </div>
        <button onClick={onConnectClick} disabled={wallet === undefined}>
          Connect wallet
        </button>
        <div>
          <textarea placeholder='message to sign' ref={textareaRef} />
          <button
            onClick={async () => {
              if (wallet && selectedWallet) {
                const message = textareaRef.current?.value || '';
                if (!isQrCodeWallet) WalletLogic.signWallet(wallet, message);
                else WalletLogic.signKlipWallet(wallet, message, setKlipqrcode);
              }
            }}
            disabled={wallet === undefined}
          >
            Sign
          </button>
        </div>
        <div className='centered'>
          <span>Choose sign type</span>
          <select
            name='chain'
            placeholder='select a chain'
            onChange={(e) => setSigntype(e.target.value as unknown as SignType)}
          >
            {Object.values(SignType)
              .filter((val) => val.startsWith('eth_signTyped'))
              .map((value) => (
                <option value={value} key={value}>
                  {value as SignType}
                </option>
              ))}
          </select>
        </div>
        <div>
          <textarea placeholder='typed data to sign' ref={textareaRef2} />
          <button
            onClick={async () => {
              if (wallet && selectedWallet) {
                const message2 = textareaRef2.current?.value || '';
                if (!isQrCodeWallet) WalletLogic.signTypedWallet(wallet, message2, getChainId(chainType), signtype);
                else {
                  WalletLogic.signTypedWalletQr(wallet, message2, getChainId(chainType), signtype, setKlipqrcode);
                }
              }
            }}
            disabled={wallet === undefined}
          >
            Sign Typed data
          </button>
        </div>
      </header>
    </div>
  );
}

export default App;
