import {
  hexToBigInt,
  keccak256,
  numberToHex,
  pad,
  slice,
  stringToBytes,
} from "viem";

const EIP_1967_BEACON_SLOT = numberToHex(
  hexToBigInt(keccak256(stringToBytes("eip1967.proxy.beacon"))) - BigInt(1)
);

const EIP_1967_LOGIC_SLOT = numberToHex(
  hexToBigInt(keccak256(stringToBytes("eip1967.proxy.implementation"))) -
    BigInt(1)
);

const OPEN_ZEPPELIN_IMPLEMENTATION_SLOT = keccak256(
  stringToBytes("org.zeppelinos.proxy.implementation")
);

const EIP_1822_LOGIC_SLOT = keccak256(stringToBytes("PROXIABLE"));

const EIP_1167_BEACON_METHOD = pad(
  slice(keccak256(stringToBytes("childImplementation()")), 0, 4),
  {
    size: 32,
    dir: "right",
  }
) as `0x${string}`;

const EIP_897_INTERFACE = pad(
  slice(keccak256(stringToBytes("implementation()")), 0, 4),
  {
    size: 32,
    dir: "right",
  }
) as `0x${string}`;

const GNOSIS_SAFE_PROXY_INTERFACE = pad(
  slice(keccak256(stringToBytes("masterCopy()")), 0, 4),
  {
    size: 32,
    dir: "right",
  }
) as `0x${string}`;

const COMPTROLLER_PROXY_INTERFACE = pad(
  slice(keccak256(stringToBytes("comptrollerImplementation()")), 0, 4),
  {
    size: 32,
    dir: "right",
  }
) as `0x${string}`;

export {
  EIP_1967_LOGIC_SLOT,
  OPEN_ZEPPELIN_IMPLEMENTATION_SLOT,
  EIP_1967_BEACON_SLOT,
  EIP_1822_LOGIC_SLOT,
  EIP_1167_BEACON_METHOD,
  EIP_897_INTERFACE,
  GNOSIS_SAFE_PROXY_INTERFACE,
  COMPTROLLER_PROXY_INTERFACE,
};
