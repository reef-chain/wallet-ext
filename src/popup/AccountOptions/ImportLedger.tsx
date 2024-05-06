import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { faSync } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import settings from "@polkadot/ui-settings";

import Account from "../Accounts/Account";
import { createAccountHardware } from "../messaging";
import { ActionContext } from "../contexts";
import { useLedger } from "../hooks/useLedger";
import { SectionTitle } from "../components/SectionTitle";
import { ErrorMessage } from "../components/ErrorMessage";
import { WarnMessage } from "../components/WarnMessage";
import Uik from "@reef-chain/ui-kit";
import { useTheme } from "../context/ThemeContext";

interface AccOption {
  text: string;
  value: number;
}

const AVAIL: number[] = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
];

export const ImportLedger = (): JSX.Element => {
  const onAction = useContext(ActionContext);
  const [accountIndex, setAccountIndex] = useState<number>(0);
  const [addressOffset, setAddressOffset] = useState<number>(0);
  const [error, setError] = useState<string>();
  const [isBusy, setIsBusy] = useState(false);
  const [name, setName] = useState<string>("");
  const [nameTouched, setNameTouched] = useState<boolean>(false);

  const {
    address,
    error: ledgerError,
    isLoading: ledgerLoading,
    isLocked: ledgerLocked,
    refresh,
    warning: ledgerWarning,
  } = useLedger(accountIndex, addressOffset);

  useEffect(() => {
    if (address) {
      settings.set({ ledgerConn: "webusb" });
    }
  }, [address]);

  const accOps = useRef(
    AVAIL.map(
      (value): AccOption => ({
        text: `Account type ${value}`,
        value,
      })
    )
  );

  const addOps = useRef(
    AVAIL.map(
      (value): AccOption => ({
        text: `Address index ${value}`,
        value,
      })
    )
  );

  const onNameChange = (name: string) => {
    setName(name);
    if (nameTouched && name.length < 3) {
      setError("Account name is too short");
    } else {
      setError(undefined);
    }
  };

  const onNameBlur = () => {
    setNameTouched(true);
    if (name.length < 3) {
      setError("Account name is too short");
    } else {
      setError(undefined);
    }
  };

  const create = async () => {
    if (!address || name.length < 3) return;
    setIsBusy(true);

    try {
      await createAccountHardware(
        address,
        "ledger",
        accountIndex,
        addressOffset,
        name
      );
      onAction("/");
    } catch (e) {
      console.error(e);
      setIsBusy(false);
      setError(e.message);
    }
  };

  // select element is returning a string
  const _onSetAccountIndex = useCallback(
    (value: number) => setAccountIndex(Number(value)),
    []
  );
  const _onSetAddressOffset = useCallback(
    (value: number) => setAddressOffset(Number(value)),
    []
  );

  const { isDarkMode } = useTheme();

  return (
    <>
      <SectionTitle text="Import Ledger account" />
      <div className="flex flex-col">
        <Account account={{ address: address || "", name: name }} />
        <div className="flex flex-col items-start">
          <Uik.Label text="Name for the account" />
          <Uik.Input
            className="text-primary rounded-md p-2 w-full"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={() => {
              onNameBlur();
            }}
          />
        </div>
        {!!address && name?.length > 3 && (
          <>
            <form className="mt-3">
              <Uik.Label text="Account type" />
              <select
                id="accountType"
                className="text-sm rounded-lg w-full p-2 bg-white text-primary"
              >
                {accOps.current.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    onClick={() => _onSetAccountIndex(opt.value)}
                  >
                    {opt.text}
                  </option>
                ))}
              </select>
            </form>
            <form className="mt-3">
              <Uik.Label text="Address index" />
              <select
                id="addressIndex"
                className="text-sm rounded-lg w-full p-2 bg-white text-primary"
              >
                {addOps.current.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    onClick={() => _onSetAddressOffset(opt.value)}
                  >
                    {opt.text}
                  </option>
                ))}
              </select>
            </form>
          </>
        )}
        {!!ledgerWarning && <WarnMessage text={ledgerWarning} />}
        {(!!error || !!ledgerError) && (
          <ErrorMessage text={error || ledgerError} />
        )}
        {ledgerLocked ? (
          <button
            onClick={() => refresh()}
            disabled={ledgerLoading || isBusy}
            className="mt-4"
          >
            <FontAwesomeIcon icon={faSync as IconProp} className={`${isDarkMode ? "text--dark-mode" : "text-black"}`} />
            <span className="ml-3">Refresh</span>
          </button>
        ) : (
          <button
            onClick={() => create()}
            disabled={!address || !!error || !!ledgerError}
            className="mt-4"
          >
            <span className="mr-3">Import account</span>
          </button>
        )}
      </div>
    </>
  );
};
