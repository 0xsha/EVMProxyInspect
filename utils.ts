import type { Address } from "viem";

const extractAddressesFromFile = async (
  filePath: string
): Promise<Address[]> => {
  const contracts = Bun.file(filePath);
  const text = await contracts.text();
  const lines = text.split("\n");

  const addresses = [];
  for (const line of lines) {
    {
      const regX = /0x[\da-fA-F]{40}/g;
      const matches = line.match(regX);
      if (matches) addresses.push(matches[0]);
    }
  }

  return addresses as `0x${string}`[];
};

export { extractAddressesFromFile };
