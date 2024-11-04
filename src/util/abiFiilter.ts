import { IABIItem } from 'interface/abi';

const abiFunctionNameFilter = (functionName: string, abi: IABIItem[]) => {
  const abiItem = abi.find((item) => item.name === functionName);
  if (!abiItem) {
    return null;
  }

  return abiItem;
};

export { abiFunctionNameFilter };
