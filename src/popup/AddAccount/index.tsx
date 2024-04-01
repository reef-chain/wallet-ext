import React, { useCallback, useEffect, useState } from "react";

import {
  faCirclePlus,
  faCodeBranch,
  faFileArrowUp,
  faFileExport,
  faKey,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { CreateAccount } from "./CreateAccount";

const enum AddAccountState {
  MENU,
  CREATE_NEW,
  DERIVE,
  EXPORT_ALL,
  IMPORT,
  RESTORE_JSON,
}

export const AddAccount = (): JSX.Element => {
  const [state, setState] = useState<AddAccountState>(AddAccountState.MENU);

  useEffect(() => {}, []);

  switch (state) {
    case AddAccountState.CREATE_NEW:
      return <CreateAccount />;

    case AddAccountState.DERIVE:
      return <div>Derive</div>;

    case AddAccountState.EXPORT_ALL:
      return <div>Export all</div>;

    case AddAccountState.IMPORT:
      return <div>Import</div>;

    case AddAccountState.RESTORE_JSON:
      return <div>Restore JSON</div>;

    default:
      return (
        <>
          <div className="my-4">
            <span className="text-lg font-bold">Add account</span>
          </div>
          <div className="flex flex-col text-base">
            <div
              className="flex justify-start items-center py-3 opacity-75 hover:cursor-pointer hover:opacity-100"
              onClick={() => setState(AddAccountState.CREATE_NEW)}
            >
              <FontAwesomeIcon icon={faCirclePlus as IconProp} />
              <span className="ml-3">Create new account</span>
            </div>
            <hr className="my-2 opacity-25" />
            <div
              className="flex justify-start items-center py-3 opacity-75 hover:cursor-pointer hover:opacity-100"
              onClick={() => setState(AddAccountState.DERIVE)}
            >
              <FontAwesomeIcon icon={faCodeBranch as IconProp} />
              <span className="ml-3">Derive from an account</span>
            </div>
            <hr className="my-2 opacity-25" />
            <div
              className="flex justify-start items-center py-3 opacity-75 hover:cursor-pointer hover:opacity-100"
              onClick={() => setState(AddAccountState.EXPORT_ALL)}
            >
              <FontAwesomeIcon icon={faFileExport as IconProp} />
              <span className="ml-3">Export all accounts</span>
            </div>
            <div
              className="flex justify-start items-center py-3 opacity-75 hover:cursor-pointer hover:opacity-100"
              onClick={() => setState(AddAccountState.IMPORT)}
            >
              <FontAwesomeIcon icon={faKey as IconProp} />
              <span className="ml-3">
                Import account from pre-existing seed
              </span>
            </div>
            <div
              className="flex justify-start items-center py-3 opacity-75 hover:cursor-pointer hover:opacity-100"
              onClick={() => setState(AddAccountState.RESTORE_JSON)}
            >
              <FontAwesomeIcon icon={faFileArrowUp as IconProp} />
              <span className="ml-3">
                Restore account from backup JSON file
              </span>
            </div>
            {/* TODO:
        ---------------------
        - Attach external QR-signer account
        - Connect Ledger device */}
          </div>
        </>
      );
  }
};
