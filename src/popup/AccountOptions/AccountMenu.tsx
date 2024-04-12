import React, { useContext } from "react";
import { faUsb } from "@fortawesome/free-brands-svg-icons";
import {
  faCirclePlus,
  faCodeBranch,
  faFileArrowUp,
  faFileExport,
  faKey,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

import { AccountsContext, ActionContext } from "../contexts";
import { SectionTitle } from "../components/SectionTitle";

export const AccountMenu = (): JSX.Element => {
  const onAction = useContext(ActionContext);
  const { accounts, selectedAccount } = useContext(AccountsContext);

  let accountToDerive =
    selectedAccount && !selectedAccount.isExternal
      ? selectedAccount.address
      : undefined;
  if (!accountToDerive && accounts.length > 0) {
    const validAccounts = accounts.filter((account) => !account.isExternal);
    if (validAccounts.length > 0) {
      accountToDerive = validAccounts[0].address;
    }
  }

  return (
    <>
      <SectionTitle text="Add account" />
      <div className="flex flex-col">
        <div
          className="flex justify-start items-center py-3 opacity-75 cursor-pointer hover:opacity-100"
          onClick={() => onAction("/account/create")}
        >
          <FontAwesomeIcon icon={faCirclePlus as IconProp} />
          <span className="ml-3">Create new account</span>
        </div>
        <hr className="my-2 opacity-25" />
        {accounts.length > 0 && (
          <>
            {accountToDerive && (
              <div
                className="flex justify-start items-center py-3 opacity-75 cursor-pointer hover:opacity-100"
                onClick={() => onAction(`/account/derive/${accountToDerive}`)}
              >
                <FontAwesomeIcon icon={faCodeBranch as IconProp} />
                <span className="ml-3">Derive from an account</span>
              </div>
            )}
            <hr className="my-2 opacity-25" />
            <div
              className="flex justify-start items-center py-3 opacity-75 cursor-pointer hover:opacity-100"
              onClick={() => onAction("/account/export-all")}
            >
              <FontAwesomeIcon icon={faFileExport as IconProp} />
              <span className="ml-3">Export all accounts</span>
            </div>
          </>
        )}
        <div
          className="flex justify-start items-center py-3 opacity-75 cursor-pointer hover:opacity-100"
          onClick={() => onAction("/account/import-seed")}
        >
          <FontAwesomeIcon icon={faKey as IconProp} />
          <span className="ml-3">Import account from pre-existing seed</span>
        </div>
        <div
          className="flex justify-start items-center py-3 opacity-75 cursor-pointer hover:opacity-100"
          onClick={() => onAction("/account/restore-json")}
        >
          <FontAwesomeIcon icon={faFileArrowUp as IconProp} />
          <span className="ml-3">Restore account from backup JSON file</span>
        </div>
        <hr className="my-2 opacity-25" />
        <div
          className="flex justify-start items-center py-3 opacity-75 cursor-pointer hover:opacity-100"
          onClick={() => onAction("/account/import-ledger")}
        >
          <FontAwesomeIcon icon={faUsb as IconProp} rotation={270} />
          <span className="ml-3">Connect Ledger device</span>
        </div>
      </div>
    </>
  );
};
