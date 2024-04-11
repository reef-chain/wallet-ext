import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import settings from "@polkadot/ui-settings";

import Account from "../Accounts/Account";
import { createAccountHardware } from "../messaging";
import { ActionContext } from "../contexts";
import { useLedger } from "../hooks/useLedger";
import { SectionTitle } from "../components/SectionTitle";
import { ErrorMessage } from "../components/ErrorMessage";

interface AccOption {
  text: string;
  value: number;
}

const AVAIL: number[] = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
];

const enum Error {
  NONE,
  NAME_TOO_SHORT,
}

export const ImportLedger = (): JSX.Element => {
  const onAction = useContext(ActionContext);
  const [accountIndex, setAccountIndex] = useState<number>(0);
  const [addressOffset, setAddressOffset] = useState<number>(0);
  const [error, setError] = useState<Error>(Error.NONE);
  const [name, setName] = useState("");
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
      setError(Error.NAME_TOO_SHORT);
    } else {
      setError(Error.NONE);
    }
  };

  const onNameBlur = () => {
    setNameTouched(true);
    if (name.length < 3) {
      setError(Error.NAME_TOO_SHORT);
    } else {
      setError(Error.NONE);
    }
  };

  const create = async () => {
    if (!address || name.length < 3) return;

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

  return (
    <>
      <SectionTitle text="Import Ledger account" />
      <div className="flex flex-col">
        {/* {account && <Account account={account} showCopyAddress={true} />} */}
        <div className="flex flex-col items-start">
          <label>Name for the account</label>
          <input
            className="text-primary rounded-md p-2 w-full"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={() => {
              onNameBlur();
            }}
          />
          {error === Error.NAME_TOO_SHORT && (
            <ErrorMessage text="Account name is too short" />
          )}
        </div>

        <button
          className="flex justify-start items-center py-3 hover:cursor-pointer"
          onClick={() => create()}
          disabled={true}
        >
          <span className="mr-3">Add account</span>
          <FontAwesomeIcon icon={faArrowRight as IconProp} />
        </button>
      </div>
    </>
  );
};
