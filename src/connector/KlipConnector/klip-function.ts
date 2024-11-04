/**
 * This file is used to append functions to the original functions given by the klipSDK
 *
 * for now of (2022/09/02), the klipSDK does not support the following functions:
 * - Signing
 *
 * so the function needed for this will be appended to the prepare of the klip sdk
 */

const KLIP_PREPARE_URL = 'https://a2a-api.klipwallet.com/v2/a2a/prepare';
const KLIP_A2A_URL = 'https://a2a-api.klipwallet.com/v2/a2a';

export type PrepareResult = {
  expiration_time: number;
  request_key: string;
  status: 'prepared';
  err?: string;
  error?: any;
};

type Auth = {
  expiration_time: number;
  request_key: string;
  status: string;
  err: string;
  error?: any;
};

export type Result = {
  expiration_time: number;
  request_key: string;
  status: 'completed' | 'prepared' | 'error' | 'canceled';
  result?: {
    klaytn_address?: string;
    tx_hash?: string;
    status?: 'success' | 'fail' | 'canceled';

    // Message sign result
    otp_fail_count?: number;
    pin_fail_count?: number;
    signature?: string;
  };
  err?: string;
  error?: any;
};

interface ISignRequest {
  bappName: string;
  from: string;
  value: string;
  chain: 'klaytn' | 'ethereum';
  successLink?: any;
  failLink?: any;
}

const auth = async (param: { bappName: string; successLink?: any; failLink?: any }) => {
  return fetch(KLIP_A2A_URL + '/prepare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bapp: { name: param.bappName, callback: { success: param.successLink, fail: param.failLink } },
      type: 'auth',
    }),
  }).then((e) => e.json());
};

const executeContract = async (params: {
  bappName: string;
  from?: string;
  to: string;
  value: string;
  abi: string;
  params: string;
  successLink?: any;
  failLink?: any;
  chain: 'klaytn' | 'ethereum';
}) => {
  return fetch(KLIP_A2A_URL + '/prepare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bapp: { name: params.bappName, callback: { success: params.successLink, fail: params.failLink } },
      type: 'execute_contract',
      transaction: { from: params.from, to: params.to, value: params.value, abi: params.abi, params: params.params },
      chain: params.chain || 'klaytn',
    }),
  }).then((e) => e.json());
};

const getResult = async (requestKey: string): Promise<Result> => {
  return fetch(`${KLIP_A2A_URL}/result?request_key=${requestKey}`, { method: 'GET' }).then((e) => e.json());
};

const sign = async (options: ISignRequest): Promise<PrepareResult> => {
  const { bappName, successLink, failLink, from, value, chain = 'klaytn' } = options;

  const data = {
    bapp: {
      name: bappName,
      callback: {
        success: successLink,
        fail: failLink,
      },
    },
    chain,
    type: 'sign_message',
    message: {
      from,
      value,
      // If value is a hex string
      is_hex_encoded: value.startsWith('0x'),
    },
  };

  const res = await fetch(KLIP_PREPARE_URL, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error('Failed to prepare sign');
  }

  const json = await res.json();

  return json as PrepareResult;
};

const prepare = {
  auth,
  sign,
  executeContract,
};

export { prepare, getResult };
