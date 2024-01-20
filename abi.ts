export const OzProxyAbi = [
  {
    anonymous: false,
    inputs: [{ indexed: false, name: "implementation", type: "address" }],
    name: "Upgraded",
    type: "event",
  },
] as const;

export const ERC1967Abi = [
  {
    anonymous: false,
    inputs: [{ indexed: true, name: "implementation", type: "address" }],
    name: "Upgraded",
    type: "event",
  },
] as const;
