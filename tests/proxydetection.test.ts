//@notice incomplete just to show how to implement tests with bun:test

import { expect, test, spyOn } from "bun:test";
import * as pd from "../proxydetection";

import type { Address } from "viem";

const usdcProxy: Address = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const proxies = [usdcProxy];
const clients = await pd.createRightClient(proxies);
const callStaticMethodSpy = spyOn(pd, "callStaticMethod");
const getImplementationFromStorageSpy = spyOn(
  pd,
  "getImplementationFromStorage"
);

test("findImplementationViaCall invokes callStaticMethod", async () => {
  // Ensure that clients is defined and has at least one element
  expect(clients).toBeDefined();
  if (typeof clients === "undefined") return;

  expect(clients.length).toBeGreaterThan(0);

  await pd.findImplementationViaCall(clients!);

  expect(callStaticMethodSpy).toHaveBeenLastCalledWith(
    clients![0].client,
    usdcProxy,
    "EIP1167",
    "0xda52571600000000000000000000000000000000000000000000000000000000"
  );
});

test("createRightClient", async () => {
  expect(clients).toBeDefined();
  expect(clients?.length).toBeGreaterThan(0);

  const client = clients?.[0].client;
  expect(client).toBeDefined();
  expect(client?.chain?.name).toBe("Ethereum");
});

test("findImplementationViaStorage", async () => {
  expect(clients).toBeDefined();
  expect(clients?.length).toBeGreaterThan(0);

  await pd.findImplementationViaStorage(clients!);

  expect(getImplementationFromStorageSpy).toHaveBeenLastCalledWith(
    clients![0].client,
    usdcProxy,
    "EIP1967BACON",
    "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
  );
});
