import { Signer } from "@reef-chain/evm-provider";

export type TxStatusHandler = (status: TxStatusUpdate) => void;

export interface AccountWithSigner {
  signer: Signer;
  address: string;
  name: string;
  balance?: bigint;
  evmAddress?: string;
  isEvmClaimed?: boolean;
}

export enum TX_STATUS_ERROR_CODE {
  ERROR_MIN_BALANCE_AFTER_TX,
  ERROR_BALANCE_TOO_LOW,
  ERROR_UNDEFINED,
}

export interface TxStatusUpdate {
  txIdent: string;
  txHash?: string;
  error?: { message: string; code: TX_STATUS_ERROR_CODE };
  isInBlock?: boolean;
  isComplete?: boolean;
  txTypeEvm?: boolean;
  url?: string;
  componentTxType?: string;
  addresses?: string[];
}
