/**
 * This file is used to append functions to the original functions given by the klipSDK
 *
 * for now of (2022/09/02), the klipSDK does not support the following functions:
 * - Signing
 *
 * so the function needed for this will be appended to the prepare of the klip sdk
 */

import {
  IAuthRequest,
  IExecuteContractRequest,
  IGetResultCommon,
  IResultAuth,
  IResultContractExecute,
  IResultSendKlay,
  IResultSign,
  ISendKlayRequest,
  ISignRequest,
  IWatchAssetRequest,
  PrepareResult,
} from './type';

// const KLUTCH_PREPARE_URL = 'https://app.klutchwallet.com/api/v1/k/prepare';
const KLUTCH_PREPARE_URL = 'https://api.kaikas.io/api/v1/k/prepare';

const postPrepareData = async (data: any, failMessage?: string) => {
  const res = await fetch(KLUTCH_PREPARE_URL, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error('Failed to prepare. ' + failMessage);
  }

  const json = await res.json();

  return json as PrepareResult;
};

const auth = async (options: IAuthRequest): Promise<PrepareResult> => {
  const { bappName, successLink, failLink } = options;

  const data = {
    bapp: {
      name: bappName,
      callback: {
        success: successLink,
        fail: failLink,
      },
    },
    type: 'auth',
  };

  return postPrepareData(data, 'auth');
};

// Function to sign a message
const sign = async (options: ISignRequest): Promise<PrepareResult> => {
  const { bappName, successLink, failLink, message } = options;

  const data = {
    bapp: {
      name: bappName,
      callback: {
        success: successLink,
        fail: failLink,
      },
    },
    type: 'sign',
    sign: {
      message,
    },
  };

  return postPrepareData(data, 'sign');
};

// Function to send KLAY to an address
const sendKLAY = async (options: ISendKlayRequest): Promise<PrepareResult> => {
  const { bappName, successLink, failLink, amount, to } = options;

  const data = {
    bapp: {
      name: bappName,
      callback: {
        success: successLink,
        fail: failLink,
      },
    },
    type: 'send_klay',
    transaction: {
      to,
      amount, // NOTE: not sure if this is a BN number or decimal as string.
    },
  };

  return postPrepareData(data, 'send KLAY');
};

// Function to add a watchable asset to the wallet
const watchAsset = async (options: IWatchAssetRequest): Promise<PrepareResult> => {
  const { bappName, successLink, failLink, address, symbol, decimals, name } = options;

  const data = {
    bapp: {
      name: bappName,
      callback: {
        success: successLink,
        fail: failLink,
      },
    },
    type: 'watch_asset',
    watch_asset: {
      address,
      symbol,
      decimals,
      name,
    },
  };

  return postPrepareData(data, 'watch asset');
};

const executeContract = async (options: IExecuteContractRequest): Promise<PrepareResult> => {
  const { bappName, successLink, failLink, abi, value, from, to, params } = options;

  const data = {
    bapp: {
      name: bappName,
      callback: {
        success: successLink,
        fail: failLink,
      },
    },
    type: 'execute_contract',
    transaction: {
      abi,
      value,
      from,
      to,
      params,
    },
  };

  return postPrepareData(data, 'execute contract');
};

const getResultCommon = async <T>(requestKey: string): Promise<IGetResultCommon<T>> => {
  // const res = await fetch(`https://app.klutchwallet.com/api/v1/k/result/${requestKey}`);
  const res = await fetch(`https://api.kaikas.io/api/v1/k/result/${requestKey}`);

  if (!res.ok) {
    throw new Error('Failed to get result');
  }

  const json = await res.json();

  return json;
};

const getResult = {
  auth: (requestKey: string) => getResultCommon<IResultAuth>(requestKey),
  sign: (requestKey: string) => getResultCommon<IResultSign>(requestKey),
  sendKLAY: (requestKey: string) => getResultCommon<IResultSendKlay>(requestKey),
  executeContract: (requestKey: string) => getResultCommon<IResultContractExecute>(requestKey),
};

const prepare = {
  auth,
  sign,
  sendKLAY,
  watchAsset,
  executeContract,
};

export { prepare, getResult };
