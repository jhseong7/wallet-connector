const getTypedDataV4 = (chainId: number, sampleMessage: string) => ({
  domain: {
    // Defining the chain aka Rinkeby testnet or Ethereum Main Net
    chainId,
    // Give a user friendly name to the specific contract you are signing for.
    name: 'Ether Mail',
    // If name isn't enough add verifying contract to make sure you are establishing contracts with the proper entity
    verifyingContract: '0x0000000000000000000000000000000000000000',
    // Just let's you know the latest version. Definitely make sure the field name is correct.
    version: '1',
  },

  // Defining the message signing data content.
  message: {
    /*
       - Anything you want. Just a JSON Blob that encodes the data you want to send
       - No required fields
       - This is DApp Specific
       - Be as explicit as possible when building out the message schema.
      */
    contents: sampleMessage,
    attachedMoneyInEth: 4.2,
    from: {
      name: 'Cow',
      wallets: ['0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000'],
    },
    to: [
      {
        name: 'Bob',
        wallets: [
          '0x0000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000',
        ],
      },
    ],
  },
  // Refers to the keys of the *types* object below.
  primaryType: 'Mail',
  types: {
    // TODO: Clarify if EIP712Domain refers to the domain the contract is hosted on
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    // Not an EIP712Domain definition
    Group: [
      { name: 'name', type: 'string' },
      { name: 'members', type: 'Person[]' },
    ],
    // Refer to PrimaryType
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person[]' },
      { name: 'contents', type: 'string' },
    ],
    // Not an EIP712Domain definition
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallets', type: 'address[]' },
    ],
  },
});

const getTypedDataV3 = (chainId: number, sampleMessage: string) => ({
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallet', type: 'address' },
    ],
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person' },
      { name: 'contents', type: 'string' },
    ],
  },
  primaryType: 'Mail',
  domain: {
    name: 'Ether Mail',
    version: '1',
    chainId,
    verifyingContract: '0x0000000000000000000000000000000000000000',
  },
  message: {
    from: { name: 'Cow', wallet: '0x0000000000000000000000000000000000000000' },
    to: { name: 'Bob', wallet: '0x0000000000000000000000000000000000000000' },
    contents: sampleMessage,
  },
});

const getTypedDataV1 = (chainId: number, sampleMessage: string) => ({
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    Person: [
      { name: 'name', type: 'string' },
      { name: 'account', type: 'address' },
    ],
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person' },
      { name: 'contents', type: 'string' },
    ],
  },
  primaryType: 'Mail',
  domain: {
    name: 'Example Dapp',
    version: '1.0',
    chainId: chainId,
    verifyingContract: '0x0000000000000000000000000000000000000000',
  },
  message: {
    from: {
      name: 'Alice',
      account: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    },
    to: {
      name: 'Bob',
      account: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    },
    contents: sampleMessage,
  },
});

const getTypedDataWyvern = (chainId: number, makerAddress: string) => ({
  types: {
    EIP712Domain: [
      {
        name: 'name',
        type: 'string',
      },
      {
        name: 'version',
        type: 'string',
      },
      {
        name: 'chainId',
        type: 'uint256',
      },
      {
        name: 'verifyingContract',
        type: 'address',
      },
    ],
    Order: [
      {
        name: 'executor',
        type: 'address',
      },
      {
        name: 'maker',
        type: 'address',
      },
      {
        name: 'staticTarget',
        type: 'address',
      },
      {
        name: 'staticSelector',
        type: 'bytes4',
      },
      {
        name: 'staticExtradata',
        type: 'bytes',
      },
      {
        name: 'maximumFill',
        type: 'uint256',
      },
      {
        name: 'listingTime',
        type: 'uint256',
      },
      {
        name: 'expirationTime',
        type: 'uint256',
      },
      {
        name: 'salt',
        type: 'uint256',
      },
    ],
  },
  domain: {
    name: 'Test Contract',
    version: '1.0',
    chainId,
    verifyingContract: '0x0000000000000000000000000000000000000000',
  },
  primaryType: 'Order',
  message: {
    executor: '0x0000000000000000000000000000000000000000',
    maker: makerAddress.toLowerCase(),
    staticTarget: '0x0000000000000000000000000000000000000000',
    staticSelector: '0x00000000',
    staticExtradata:
      '0x00000000000000000000000000000000000000000000000000000',
    maximumFill: '1',
    listingTime: '1666789948',
    expirationTime: '1676789935',
    salt: '47251',
  },
});

const sample = {
  getTypedDataV4,
  getTypedDataV3,
  getTypedDataV1,
  getTypedDataWyvern,
};

export default sample;
