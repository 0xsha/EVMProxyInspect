import {
  createPublicClient,
  http,
  isAddress,
  pad,
  trim,
  type Address,
  type PublicClient,
} from "viem";

import {
  OPEN_ZEPPELIN_IMPLEMENTATION_SLOT,
  EIP_1967_LOGIC_SLOT,
  EIP_1822_LOGIC_SLOT,
  EIP_1967_BEACON_SLOT,
  EIP_1167_BEACON_METHOD,
  EIP_897_INTERFACE,
  GNOSIS_SAFE_PROXY_INTERFACE,
  COMPTROLLER_PROXY_INTERFACE,
} from "./signatures";

import {
  arbitrum,
  avalanche,
  base,
  bsc,
  holesky,
  kava,
  linea,
  mainnet,
  opBNB,
  optimism,
  polygon,
  polygonZkEvm,
  zkSync,
  gnosis,
} from "viem/chains";

import { ERC1967Abi, OzProxyAbi } from "./abi";

const slots_storage_obj = {
  OZ: OPEN_ZEPPELIN_IMPLEMENTATION_SLOT,
  EIP1967: EIP_1967_BEACON_SLOT,
  EIP1822: EIP_1822_LOGIC_SLOT,
  EIP1967BACON: EIP_1967_LOGIC_SLOT,
};

const static_calls_obj = {
  EIP897: EIP_897_INTERFACE,
  GNOSIS: GNOSIS_SAFE_PROXY_INTERFACE,
  COMPTROLLER: COMPTROLLER_PROXY_INTERFACE,
  EIP1167: EIP_1167_BEACON_METHOD,
};

const supportedChains = [
  mainnet,
  bsc,
  opBNB,
  optimism,
  zkSync,
  arbitrum,
  avalanche,
  polygon,
  polygonZkEvm,
  base,
  linea,
  holesky,
  kava,
  gnosis,
];

const inContract = async (
  client: PublicClient,
  address: Address
): Promise<boolean | undefined> => {
  const bytecode = await client.getBytecode({
    address: address,
  });

  return typeof bytecode !== "undefined";
};

const isValidContractAddress = async (
  client: PublicClient,
  address: Address
) => {
  let contractResult = await inContract(client, address);
  return isAddress(address) && contractResult;
};

// keep addresses and clients in sync
type ClientsArray = {
  client: PublicClient;
  address: Address;
};

const createRightClient = async (
  addresses: Address[]
): Promise<ClientsArray[] | undefined> => {
  const clients: ClientsArray[] = [];

  for (const address of addresses) {
    for (const chain of supportedChains) {
      let rpcUrl: string;

      // in case want to change the rpcUrl for a specific chain
      if (chain.name === "Ethereum") {
        rpcUrl = "https://eth.llamarpc.com";
      } else {
        rpcUrl = chain.rpcUrls.default.http[0];
      }

      const client = createPublicClient({
        chain: chain,
        transport: http(rpcUrl),
      });

      let isValidClient = await isValidContractAddress(client, address);

      if (isValidClient) {
        console.log("Found contract: ", address + " on chain: ", chain.name);
        clients.push({ client: client, address: address });
      }
    }
  }
  return clients;
};

const logImplementationDetails = (
  proxy: Address,
  implementation: Address | string,
  blockNumber: bigint,
  methodName: string,
  client: PublicClient
) => {
  if (isAddress(implementation)) {
    console.log(
      "Found implementation for proxy: ",
      proxy,
      " at: ",
      implementation,
      " via method: ",
      methodName,
      "at block: ",
      blockNumber,
      " on chain: ",
      client.chain?.name
    );
  }
};

const callStaticMethod = async (
  client: PublicClient,
  proxy: Address,
  methodName: string,
  callData: `0x${string}`,
  blockNumber?: bigint
) => {
  try {
    if (typeof blockNumber === "undefined") {
      blockNumber = await client.getBlockNumber();
    }

    const data = await client.call({
      blockNumber: blockNumber,
      account: pad("0x00", { size: 20 }),
      data: callData,
      to: proxy,
    });
    if (typeof data.data === "undefined") return;
    const implementation = trim(data.data);
    logImplementationDetails(
      proxy,
      implementation,
      blockNumber,
      methodName,
      client
    );
  } catch {
    // reverts if the method is not implemented
  }
};

const findImplementationViaCall = async (clientAddresses: ClientsArray[]) => {
  for (const { client, address } of clientAddresses) {
    for (const [methodName, callData] of Object.entries(static_calls_obj)) {
      await callStaticMethod(client, address, methodName, callData);
    }
  }
};

const getImplementationFromStorage = async (
  client: PublicClient,
  proxy: Address,
  methodName: string,
  slot: `0x${string}`,
  fromBlock?: bigint
) => {
  if (typeof fromBlock !== "undefined") {
    {
      let implementations: any = [];

      try {
        for (let i = fromBlock; i >= 0; i--) {
          console.log("Looking at block number: ", i);

          let implementation = await client.getStorageAt({
            address: proxy,
            slot: slot,
            blockNumber: i,
          });

          if (typeof implementation !== "undefined") {
            implementation = trim(implementation);
            if (implementation !== "0x00") {
              if (!implementations.includes(implementation)) {
                implementations.push(implementation);
                logImplementationDetails(
                  proxy,
                  implementation,
                  i,
                  methodName,
                  client
                );
              }
            }
          }
        }
      } catch {}
    }
  }

  try {
    const currentBlock = await client.getBlockNumber();
    let implementation = await client.getStorageAt({
      address: proxy,
      slot: slot,
      blockNumber: currentBlock,
    });

    if (typeof implementation !== "undefined") {
      implementation = trim(implementation);
      if (implementation !== "0x00") {
        logImplementationDetails(
          proxy,
          implementation,
          currentBlock,
          methodName,
          client
        );
      }
    }
  } catch {
    // reverts if the method is not implemented
  }
};

const findImplementationViaStorage = async (
  clientAddresses: ClientsArray[]
) => {
  for (const { client, address } of clientAddresses) {
    for (const [methodName, slot] of Object.entries(slots_storage_obj)) {
      await getImplementationFromStorage(client, address, methodName, slot);
    }
  }
};

const getImplementationHistoryForCallMethod = async (
  proxy: Address,
  fromBlock: bigint,
  methodName: string
) => {
  let clients = await createRightClient([proxy]);
  if (typeof clients === "undefined") return;

  const client = clients[0].client;
  if (typeof client === "undefined") return;

  if (
    methodName === "EIP1167" ||
    methodName === "EIP1822" ||
    methodName === "EIP897"
  ) {
    for (let i = fromBlock; i >= 0; i -= 100n) {
      console.log("Looking at block range: ", i - 100n, " - ", i);

      const logs = await client.getContractEvents({
        address: proxy,
        abi: ERC1967Abi,
        eventName: "Upgraded",
        fromBlock: i - 100n,
        toBlock: i,
      });

      if (logs.length > 0) {
        console.log(
          "Found implementiation at block ",
          logs[0].blockNumber,
          "At address: ",
          logs[0].args.implementation
        );
      }
    }
  } else {
    for (let i = fromBlock; i >= 0; i -= 100n) {
      console.log("Looking at block range: ", i - 100n, " - ", i);

      const logs = await client.getContractEvents({
        address: proxy,
        abi: OzProxyAbi,
        eventName: "Upgraded",
        fromBlock: i - 100n,
        toBlock: i,
      });

      if (logs.length > 0) {
        console.log(
          "Found implementiation at block ",
          logs[0].blockNumber,
          "At address: ",
          logs[0].args.implementation
        );
      }
    }
  }
};

const getImplementationHistoryForStorageMethod = async (
  proxy: Address,
  fromBlock: bigint,
  methodName: string
) => {
  let clients = await createRightClient([proxy]);
  if (typeof clients === "undefined") return;

  const client = clients[0].client;
  if (typeof client === "undefined") return;

  const slot = slots_storage_obj[methodName as keyof typeof slots_storage_obj];

  await getImplementationFromStorage(
    client,
    proxy,
    methodName,
    slot,
    fromBlock
  );
};

export {
  createRightClient,
  findImplementationViaCall,
  callStaticMethod,
  findImplementationViaStorage,
  getImplementationFromStorage,
  getImplementationHistoryForCallMethod,
  getImplementationHistoryForStorageMethod,
  inContract,
  isValidContractAddress,
};
