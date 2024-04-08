// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useMemo, useState } from "react";
import { Ledger } from "@reef-defi/hw-ledger";
import uiSettings from "@polkadot/ui-settings";

// TODO: Mainnet/testnet selection required?

interface StateBase {
  isLedgerCapable: boolean;
  isLedgerEnabled: boolean;
}

interface State extends StateBase {
  address: string | null;
  error: string | null;
  isLedgerCapable: boolean;
  isLedgerEnabled: boolean;
  isLoading: boolean;
  isLocked: boolean;
  ledger: Ledger | null;
  refresh: () => void;
  warning: string | null;
}

function getState(): StateBase {
  const isLedgerCapable = !!(window as unknown as { USB?: unknown }).USB;

  return {
    isLedgerCapable,
    isLedgerEnabled: isLedgerCapable && uiSettings.ledgerConn !== "none",
  };
}

export function useLedger(accountIndex = 0, addressOffset = 0): State {
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [refreshLock, setRefreshLock] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const ledger = useMemo(() => {
    setIsLocked(false);
    setRefreshLock(false);

    // this trick allows to refresh the ledger on demand
    // when it is shown as locked and the user has actually
    // unlocked it, which we can't know.
    if (refreshLock) {
      return new Ledger("webusb", "reef-mainnet");
    }

    return null;
  }, [refreshLock]);

  useEffect(() => {
    if (!ledger) {
      setAddress(null);

      return;
    }

    setIsLoading(true);
    setError(null);
    setWarning(null);

    ledger
      .getAddress(false, accountIndex, addressOffset)
      .then((res) => {
        setIsLoading(false);
        setAddress(res.address);
      })
      .catch((e: Error) => {
        setIsLoading(false);

        const warningMessage = e.message.includes("Code: 26628")
          ? "Is your ledger locked?"
          : null;

        const errorMessage = e.message.includes("App does not seem to be open")
          ? `App does not seem to be open`
          : e.message;

        setIsLocked(true);
        setWarning(warningMessage);
        setError(`Ledger error: ${errorMessage}`);
        console.error(e);
        setAddress(null);
      });
    // If the dependency array is exhaustive, with t, the translation function, it
    // triggers a useless re-render when ledger device is connected.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountIndex, addressOffset, ledger]);

  const refresh = useCallback(() => {
    setRefreshLock(true);
    setError(null);
    setWarning(null);
  }, []);

  return {
    ...getState(),
    address,
    error,
    isLoading,
    isLocked,
    ledger,
    refresh,
    warning,
  };
}
