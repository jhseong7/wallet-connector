import { SignType } from '../enum';

const signTypeToMethodName = (signType: SignType) => {
  switch (signType) {
    case SignType.SIGN_TYPED_DATA:
    case SignType.SIGN_TYPED_DATA_V1:
      return 'eth_signTypedData';
    case SignType.SIGN_TYPED_DATA_V3:
      return 'eth_signTypedData_v3';
    case SignType.SIGN_TYPED_DATA_V4:
      return 'eth_signTypedData_v4';
    default:
      throw new Error('Unknown sign type');
  }
};

const signUtil = {
  signTypeToMethodName,
};

export { signUtil };
