interface IABIItemInput {
  name: string;
  type: string;
  indexed?: boolean;
}

interface IABIItemOutput {
  name: string;
  type: string;
  indexed?: boolean;
}

// ABI interface
interface IABIItem {
  inputs: IABIItemInput[];
  name: string;
  outputs?: IABIItemOutput[];
  stateMutability: string;
  type: string;
}

export type { IABIItem, IABIItemInput, IABIItemOutput };
