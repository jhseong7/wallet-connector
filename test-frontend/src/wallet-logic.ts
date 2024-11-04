import KlipConnector from '@jhseong7/wallet-connector/dist/connector/KlipConnector';
import { keccak256 } from 'ethereum-cryptography/keccak';
import { SignType, WalletType } from '@jhseong7/wallet-connector/dist/enum';
import { IQRConnector, IWalletConnector } from '@jhseong7/wallet-connector/dist/interface';
import { toast } from 'react-toastify';
import {
  recoverTypedSignature,
  SignTypedDataVersion,
  recoverPersonalSignature,
  TypedMessage,
  MessageTypes,
} from '@metamask/eth-sig-util';
import { ecrecover, toBuffer, pubToAddress, bufferToHex, fromRpcSig, hashPersonalMessage } from '@ethereumjs/util';
import sample from './sample';
import Web3 from 'web3';

const klaytnHashPersonalMessage = function (message: string): Buffer {
  const bufferMessage = Buffer.from(message, 'utf-8');
  const prefix = Buffer.from(`\u0019Klaytn Signed Message:\n${bufferMessage.length}`, 'utf-8');
  return Buffer.from(keccak256(Buffer.concat([prefix, bufferMessage])));
};

const validateTyped = async (
  address: string,
  msgParams: TypedMessage<MessageTypes>,
  signature: string,
  signType: SignType
) => {
  let recoveredAddress = '';

  console.log({ address, msgParams, signature, signType });

  switch (signType) {
    case SignType.SIGN_TYPED_DATA:
    case SignType.SIGN_TYPED_DATA_V1:
      recoveredAddress = await recoverTypedSignature({
        data: msgParams as any,
        signature,
        version: SignTypedDataVersion.V1,
      });
      break;
    case SignType.SIGN_TYPED_DATA_V3:
      recoveredAddress = await recoverTypedSignature({ data: msgParams, signature, version: SignTypedDataVersion.V3 });
      break;
    case SignType.SIGN_TYPED_DATA_V4:
      recoveredAddress = await recoverTypedSignature({ data: msgParams, signature, version: SignTypedDataVersion.V4 });
      break;
    default:
      throw new Error('Invalid sign type');
  }

  console.log({ recoveredAddress, address });
  return recoveredAddress.toLowerCase() === address.toLowerCase();
};

const validatePersonal = async (address: string, message: any, signature: string) => {
  const recoveredAddress = await recoverPersonalSignature({ data: message, signature });

  console.log({ recoveredAddress, address });

  // Other try
  // const msg = Web3.utils.sha3('\x19Ethereum Signed Message:' + message);
  const signedMessage = '\x19Klaytn Signed Message:\n' + message.length + message;
  // const msg = Web3.utils.keccak256(signedMessage);
  const msg2 = klaytnHashPersonalMessage(message);
  const { v, r, s } = fromRpcSig(signature);
  const pubKey = ecrecover(msg2, v, r, s);
  const addrBuf = pubToAddress(pubKey);
  const recoveredAddress2 = bufferToHex(addrBuf);

  console.log({ recoveredAddress2, address });

  return recoveredAddress.toLowerCase() === address.toLowerCase();
};

const connectWallet = async (walletConnector: IWalletConnector, walletType: WalletType) => {
  try {
    const result = await walletConnector.activate();

    if (result) {
      toast('Wallet connected successfully');
    } else {
      toast('Wallet connection failed', { type: 'error' });
    }
  } catch (error) {
    toast('Wallet connection failed', { type: 'error' });
    console.log(error);
  }
};

const connectKlipWallet = async (
  walletConnector: IWalletConnector,
  walletType: WalletType,
  qrCodeCallback: (qr: string) => void
) => {
  const klipConnector = walletConnector as unknown as KlipConnector;

  klipConnector.abortPendingActivation();

  klipConnector.setQrCodeSetCallback(qrCodeCallback);
  klipConnector.setDeeplinkSetCallback((link) => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    console.log('link', link, isMobile);

    if (isMobile) {
      window.open(link);

      if (isSafari) {
        window.location.href = link;
      }
    }
  });
  const result = await connectWallet(klipConnector, walletType);
  qrCodeCallback('');
  return result;
};

const connectQrWallet = async (
  walletConnector: IWalletConnector,
  walletType: WalletType,
  qrCodeCallback: (qr: string) => void
) => {
  const qrConnector = walletConnector as unknown as IWalletConnector & IQRConnector;

  qrConnector.abortPendingActivation();

  qrConnector.setQrCodeSetCallback(qrCodeCallback);

  const result = await connectWallet(qrConnector, walletType);
  qrCodeCallback('');
  return result;
};

const signWallet = async (walletConnector: IWalletConnector, message: string) => {
  try {
    const result = await walletConnector.sign(message);

    if (result) {
      toast('signature: ' + result);

      // Validate signature
      if (walletConnector.currentAddress) {
        const isValid = await validatePersonal(walletConnector.currentAddress, message, result);
        toast(`Signature is ${isValid ? 'valid' : 'invalid'}`);
      }
      console.log(result);
    } else {
      toast('Wallet sign failed', { type: 'error' });
    }
  } catch (error) {
    toast('Wallet sign failed', { type: 'error' });
    console.log(error);
  }
};

const signTypedWallet = async (
  walletConnector: IWalletConnector,
  message: string,
  chainId: number,
  signType: SignType
) => {
  try {
    // let msgParams;
    const msgParams = JSON.parse(message);

    // switch (signType) {
    //   case SignType.SIGN_TYPED_DATA:
    //   case SignType.SIGN_TYPED_DATA_V1:
    //     msgParams = sample.getTypedDataV1(chainId, message);
    //     break;
    //   case SignType.SIGN_TYPED_DATA_V3:
    //     msgParams = sample.getTypedDataV3(chainId, message);
    //     break;
    //   case SignType.SIGN_TYPED_DATA_V4:
    //     // msgParams = sample.getTypedDataV4(chainId, message);
    //     msgParams = sample.getTypedDataWyvern(chainId, walletConnector.currentAddress || '0x1234');
    //     break;

    //   default:
    //     msgParams = sample.getTypedDataV1(chainId, message);
    // }

    console.log({ msgParams });
    console.log(JSON.stringify(msgParams));

    const result = await walletConnector.signTypedData(msgParams, signType);

    if (result) {
      toast('signature: ' + result);
      console.log(`Sign typed data : ${signType}  `, result);

      // Validate signature
      if (walletConnector.currentAddress) {
        const isValid = await validateTyped(walletConnector.currentAddress, msgParams, result, signType);
        toast(`Signature is ${isValid ? 'valid' : 'invalid'}`);
      }
    } else {
      toast('Wallet sign failed', { type: 'error' });
    }
  } catch (error) {
    toast('Wallet sign failed', { type: 'error' });
    console.log(error);
  }
};

const signKlipWallet = async (
  walletConnector: IWalletConnector,
  message: string,
  qrCodeCallback: (qr: string) => void
) => {
  const qrConnector = walletConnector as unknown as IWalletConnector & IQRConnector;

  qrConnector.abortPendingSign();
  qrConnector.setQrCodeSetCallback(qrCodeCallback);
  // klipConnector.setDeeplinkSetCallback((link: string) => {
  //   console.log('link', link);
  //   const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  //   if (isMobile) {
  //     window.open(link);
  //   }
  // });
  const result = await signWallet(qrConnector, message);
  qrCodeCallback('');
  return result;
};

const signTypedWalletQr = async (
  walletConnector: IWalletConnector,
  message: string,
  chainId: number,
  signType: SignType,
  qrCodeCallback: (qr: string) => void
) => {
  const qrConnector = walletConnector as unknown as IWalletConnector & IQRConnector;

  qrConnector.abortPendingSign();
  qrConnector.setQrCodeSetCallback(qrCodeCallback);

  const result = await signTypedWallet(qrConnector, message, chainId, signType);

  qrCodeCallback('');

  return result;
};

const WalletLogic = {
  connectWallet,
  connectKlipWallet,
  connectQrWallet,
  signWallet,
  signKlipWallet,
  signTypedWallet,
  signTypedWalletQr,
};

export { WalletLogic };
