import React, { useContext, useEffect } from "react";

import {
  faCirclePlus,
  faCodeBranch,
  faFileArrowUp,
  faFileExport,
  faKey,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

import { ActionContext } from "../contexts";

export const AccountMenu = (): JSX.Element => {
  const onAction = useContext(ActionContext);
  useEffect(() => {}, []);

  return (
    <>
      <div className="mt-4 mb-2">
        <span className="text-lg font-bold">Add account</span>
      </div>
      <div className="flex flex-col">
        <div
          className="flex justify-start items-center py-3 opacity-75 hover:cursor-pointer hover:opacity-100"
          onClick={() => onAction("/account/create")}
        >
          <FontAwesomeIcon icon={faCirclePlus as IconProp} />
          <span className="ml-3">Create new account</span>
        </div>
        <hr className="my-2 opacity-25" />
        <div
          className="flex justify-start items-center py-3 opacity-75 hover:cursor-pointer hover:opacity-100"
          onClick={() => onAction("/account/derive")}
        >
          <FontAwesomeIcon icon={faCodeBranch as IconProp} />
          <span className="ml-3">Derive from an account</span>
        </div>
        <hr className="my-2 opacity-25" />
        <div
          className="flex justify-start items-center py-3 opacity-75 hover:cursor-pointer hover:opacity-100"
          onClick={() => onAction("/account/export-all")}
        >
          <FontAwesomeIcon icon={faFileExport as IconProp} />
          <span className="ml-3">Export all accounts</span>
        </div>
        <div
          className="flex justify-start items-center py-3 opacity-75 hover:cursor-pointer hover:opacity-100"
          onClick={() => onAction("/account/import-seed")}
        >
          <FontAwesomeIcon icon={faKey as IconProp} />
          <span className="ml-3">Import account from pre-existing seed</span>
        </div>
        <div
          className="flex justify-start items-center py-3 opacity-75 hover:cursor-pointer hover:opacity-100"
          onClick={() => onAction("/account/restore-json")}
        >
          <FontAwesomeIcon icon={faFileArrowUp as IconProp} />
          <span className="ml-3">Restore account from backup JSON file</span>
        </div>
        {/* TODO:
        ---------------------
        - Attach external QR-signer account
        - Connect Ledger device */}
      </div>
    </>
  );
};
