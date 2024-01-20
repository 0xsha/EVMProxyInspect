import { isAddress, type Address } from "viem";
import { extractAddressesFromFile } from "./utils";
import {
  createRightClient,
  findImplementationViaCall,
  findImplementationViaStorage,
  getImplementationHistoryForCallMethod,
  getImplementationHistoryForStorageMethod,
} from "./proxydetection";

const printUsage = () => {
  console.log(`
  Usage: bun index.ts [options] 
  Options:
    -f <file>     File containing a list of proxy addresses
    -p <address>  Proxy address
    -b <number>   Starting block number to reverse search from
    -m <method>   Method name
    * you can use either provide a file or a proxy address

  `);
};

const parseCli = async (args: string[]) => {
  // Default values
  let fileName: string | undefined;
  let historyFlag = false;
  let proxy: Address | undefined;
  let startingBlock: bigint | undefined;
  let endingBlock: bigint | undefined;
  let methodName: string | undefined;

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "-f":
        fileName = args[i + 1];
        break;
      case "-h":
        printUsage();
        break;
      case "-p":
        historyFlag = true;
        proxy = args[i + 1] as Address;
        break;
      case "-b":
        startingBlock = BigInt(args[i + 1]);
        break;
      case "-m":
        methodName = args[i + 1];
        break;
    }
  }

  if (typeof fileName === "undefined" && typeof proxy === "undefined") {
    printUsage();
    return;
  }
  if (typeof fileName !== "undefined") {
    const proxies = await extractAddressesFromFile(fileName); // Pass the file name to the function

    const clients = await createRightClient(proxies);
    if (typeof clients === "undefined") return;

    await findImplementationViaCall(clients);
    await findImplementationViaStorage(clients);
  } else if (
    typeof startingBlock !== "undefined" &&
    typeof proxy !== "undefined" &&
    typeof methodName !== "undefined" &&
    isAddress(proxy) &&
    historyFlag
  ) {
    if (
      methodName === "EIP1167" ||
      methodName === "EIP1822" ||
      methodName === "EIP897" ||
      methodName === "OZ"
    )
      await getImplementationHistoryForCallMethod(
        proxy,
        startingBlock,
        methodName
      );
    else if (
      methodName === "EIP897" ||
      methodName === "GNOSIS" ||
      methodName === "EIP1967BACON" ||
      methodName === "COMPTROLLER"
    )
      await getImplementationHistoryForStorageMethod(
        proxy,
        startingBlock,
        methodName
      );
    else {
      console.log("Invalid method name");
      return;
    }
  }
};

const main = async () => {
  const args = process.argv.slice(2); // Get command line arguments
  await parseCli(args);
};

main();
