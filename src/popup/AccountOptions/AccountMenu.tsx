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
import Uik from "@reef-chain/ui-kit";
import strings from "../../i18n/locales";
import { useTheme } from "../context/ThemeContext";

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

  const { isDarkMode } = useTheme();

  return (
    <div className="p-4">
      <SectionTitle text={strings.add_acc} />
      <div className="flex flex-col">
        <div
          className="flex justify-start items-center py-3 opacity-75 cursor-pointer hover:opacity-100"
          onClick={() => onAction("/account/create")}
        >

          <FontAwesomeIcon icon={faCirclePlus as IconProp} className={isDarkMode ? "text--dark-mode" : "text-black"} />
          <Uik.Text type="light" className={`ml-5 ${isDarkMode ? "text--dark-mode" : ""}`} text={strings.create_new_acc} />
        </div>
        <hr className={`my-2 opacity-25`} style={isDarkMode ? {

        } : {
          border: "0.2px solid black"
        }} />
        {accounts.length > 0 && (
          <>
            {accountToDerive && (
              <div
                className="flex justify-start items-center py-3 opacity-75 cursor-pointer hover:opacity-100"
                onClick={() => onAction(`/account/derive/${accountToDerive}`)}
              >
                <FontAwesomeIcon icon={faCodeBranch as IconProp} className={isDarkMode ? "text--dark-mode" : "text-black"} />
                <Uik.Text type="light" className={`ml-5 ${isDarkMode ? "text--dark-mode" : ""}`} text={strings.derive} />
              </div>
            )}
            <hr className="my-2 opacity-25" style={isDarkMode ? {

            } : {
              border: "0.2px solid black"
            }} />
            <div
              className="flex justify-start items-center py-3 opacity-75 cursor-pointer hover:opacity-100"
              onClick={() => onAction("/account/export-all")}
            >
              <FontAwesomeIcon icon={faFileExport as IconProp} className={isDarkMode ? "text--dark-mode" : "text-black"} />
              <Uik.Text type="light" className={`ml-5 ${isDarkMode ? "text--dark-mode" : ""}`} text={strings.export_all} />
            </div>
          </>
        )}
        <div
          className="flex justify-start items-center py-3 opacity-75 cursor-pointer hover:opacity-100"
          onClick={() => onAction("/account/import-seed")}
        >

          <FontAwesomeIcon icon={faKey as IconProp} className={isDarkMode ? "text--dark-mode" : "text-black"} />
          <Uik.Text type="light" className={`ml-5 ${isDarkMode ? "text--dark-mode" : ""}`} text={strings.import_pre_existing_seed} />

        </div>
        <div
          className="flex justify-start items-center py-3 opacity-75 cursor-pointer hover:opacity-100"
          onClick={() => onAction("/account/restore-json")}
        >

          <FontAwesomeIcon icon={faFileArrowUp as IconProp} className={isDarkMode ? "text--dark-mode" : "text-black"} />
          <Uik.Text type="light" className={`ml-5 ${isDarkMode ? "text--dark-mode" : ""}`} text={strings.restore_account_json} />


        </div>
        <hr className="my-2 opacity-25" style={isDarkMode ? {

        } : {
          border: "0.2px solid black"
        }} />
        <div
          className="flex justify-start items-center py-3 opacity-75 cursor-pointer hover:opacity-100"
          onClick={() => onAction("/account/import-ledger")}
        >

          <FontAwesomeIcon icon={faUsb as IconProp} rotation={270} className={isDarkMode ? "text--dark-mode" : "text-black"} />
          <Uik.Text type="light" className={`ml-5 ${isDarkMode ? "text--dark-mode" : ""}`} text={strings.connect_ledger_device} />

        </div>
      </div>
    </div>
  );
};
