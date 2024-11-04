interface PrepareResult {
  expiration_time: number;
  request_key: string;
  chain_id: string;
  code: number;
  message: string | null;
  status: 'prepared';
  err?: string;
  error?: any;
}

interface ISignRequest {
  bappName: string;
  from: string;
  message: string;
  successLink?: any;
  failLink?: any;
}

interface ISendKlayRequest {
  bappName: string;
  to: string;
  amount: string;
  successLink?: any;
  failLink?: any;
}

interface IWatchAssetRequest {
  bappName: string;
  successLink?: any;
  failLink?: any;
  address: string;
  symbol: string;
  decimals: number;
  name: string;
}

interface IAuthRequest {
  bappName: string;
  successLink?: any;
  failLink?: any;
}

interface IExecuteContractRequest {
  bappName: string;
  successLink?: any;
  failLink?: any;
  abi: string;
  value: string;
  from: string;
  to: string;
  params: string;
}

interface IGetResultCommon<T> {
  status: 'completed' | 'canceled' | 'failed' | 'error' | 'prepared' | 'requested';
  request_key: string;
  chain_id: string;
  type: string;
  code: number;
  message: string | null;
  expiration_time: number;
  result: T;
}

interface IResultAuth {
  klaytn_address: string;
}

interface IResultSign {
  address: string;
  signed_data: string;
}

interface IResultSendKlay {
  tx_hash: string;
  signed_tx: string;
}

interface IResultContractExecute {
  tx_hash: string;
  signed_tx: string;
}

export type {
  PrepareResult,
  ISignRequest,
  ISendKlayRequest,
  IWatchAssetRequest,
  IAuthRequest,
  IExecuteContractRequest,
  IGetResultCommon,
  IResultAuth,
  IResultSign,
  IResultSendKlay,
  IResultContractExecute,
};
