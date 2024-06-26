import { Provider } from "@reef-chain/evm-provider";

import {
  AccountWithSigner,
  TX_STATUS_ERROR_CODE,
  TxStatusHandler,
} from "../types";

export const handleErr = (
  e: { message: string } | string,
  txIdent: string,
  txHash: string,
  txHandler: TxStatusHandler,
  account: AccountWithSigner
): void => {
  // @ts-ignore
  let message = e.message || e;
  let code = TX_STATUS_ERROR_CODE.ERROR_UNDEFINED;
  if (
    message &&
    (message.indexOf("-32603: execution revert: 0x") > -1 ||
      message?.indexOf("InsufficientBalance") > -1)
  ) {
    message =
      "You must allow minimum 60 REEF on account for Ethereum VM transaction even if transaction fees will be much lower.";
    code = TX_STATUS_ERROR_CODE.ERROR_MIN_BALANCE_AFTER_TX;
  }
  if (message && message?.startsWith("1010")) {
    message = "Balance too low.";
    code = TX_STATUS_ERROR_CODE.ERROR_BALANCE_TOO_LOW;
  }
  if (message && message?.startsWith("balances.InsufficientBalance")) {
    message = "Balance too low for transfer and fees.";
    code = TX_STATUS_ERROR_CODE.ERROR_BALANCE_TOO_LOW;
  }
  if (code === TX_STATUS_ERROR_CODE.ERROR_UNDEFINED) {
    message = `Transaction error: ${message}`;
  }
  txHandler({
    txIdent,
    txHash,
    error: { message, code },
    addresses: [account.address],
  });
};

export const sendToNativeAddress = (
  provider: Provider,
  sender: AccountWithSigner,
  toAmt: bigint,
  to: string,
  txHandler: TxStatusHandler
): string => {
  const txIdent = Math.random().toString(10);
  const transfer = provider.api.tx.balances.transfer(to, toAmt.toString());
  sender.signer.getSubstrateAddress().then((substrateAddress) => {
    transfer
      .signAndSend(
        substrateAddress,
        { signer: sender.signer.signingKey },
        (res) => {
          const txHash = transfer.hash.toHex();
          txHandler({
            txIdent,
            txHash,
            isInBlock: res.isInBlock,
            isComplete: res.isFinalized,
            addresses: [sender.address, to],
          });
        }
      )
      .catch((e) => {
        console.log("sendToNativeAddress err=", e);
        handleErr(e, txIdent, "", txHandler, sender);
      });
  });

  return txIdent;
};
