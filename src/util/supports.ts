import { IDeepLinkConnector, IExtensionConnector, IQRConnector, IWalletConnector } from '../interface';
import { WalletInterfaceType } from '../interface/wallet-interface-type';

function isWalletInterfaceSupported(connector: IWalletConnector, interfaceType: WalletInterfaceType) {
  switch (interfaceType) {
    case WalletInterfaceType.QR_CONNECTOR:
      return (connector as unknown as IQRConnector)?.supportsQRConnector || false;
    case WalletInterfaceType.DEEPLINK_CONNECTOR:
      return (connector as unknown as IDeepLinkConnector)?.supportsDeepLinkConnector || false;
    case WalletInterfaceType.EXTENSION_CONNECTOR:
      return (connector as unknown as IExtensionConnector)?.supportsExtensionConnector || false;
    default:
      return false;
  }
}

export { isWalletInterfaceSupported };
