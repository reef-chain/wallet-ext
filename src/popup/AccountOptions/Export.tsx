import React, { useContext, useEffect, useState } from "react";
import { saveAs } from "file-saver";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

import { AccountsContext, ActionContext } from "../contexts";
import { exportAccount } from "../messaging";
import { useParams } from "react-router";
import Account from "../Accounts/Account";
import { AccountWithSigner } from "../types";

export const Export = (): JSX.Element => {
  const onAction = useContext(ActionContext);
  const { accountsWithSigners } = useContext(AccountsContext);
  const { address } = useParams();

  const [account, setAccount] = useState<AccountWithSigner>();
  const [error, setError] = useState("");
  const [password, setPassword] = useState<string>("");

  useEffect(() => {
    if (accountsWithSigners && address) {
      const acc = accountsWithSigners.find((a) => a.address === address);
      if (acc) {
        setAccount(acc);
      }
    }
  }, [accountsWithSigners, address]);

  const exportOne = async () => {
    try {
      const exportedJson = await exportAccount(address, password);
      const blob = new Blob([JSON.stringify(exportedJson)], {
        type: "application/json; charset=utf-8",
      });
      saveAs(blob, `${address}.json`);
      onAction("/");
    } catch (e) {
      console.error(e);
      setError(e.message);
    }
  };

  return (
    <>
      <div className="text-center text-lg font-bold">Export account</div>
      <div className="flex flex-col">
        {account && <Account account={{ ...account }} showCopyAddress={true} />}
        <div className="flex mb-2 border-l-primary border-l-4 pl-2">
          <FontAwesomeIcon
            className="text-primary mr-2 pt-1"
            icon={faExclamationTriangle as IconProp}
          />
          <span className="text-left text-gray-300">
            You are exporting your account. Keep it safe and don't share it with
            anyone.
          </span>
        </div>
        <div className="flex flex-col items-start my-3">
          <label className="text-base">Password for this account</label>
          <input
            className="text-primary rounded-md p-2 w-full"
            value={password}
            type="password"
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
          />
          {error && (
            <div className="text-red-500 mt-1">
              <FontAwesomeIcon
                className="mr-2"
                icon={faExclamationTriangle as IconProp}
              />
              <span>Password is not correct</span>
            </div>
          )}
        </div>
        <button
          className="mt-4 py-3 hover:cursor-pointer"
          onClick={() => exportOne()}
          disabled={!password || error !== ""}
        >
          Export account
        </button>
      </div>
    </>
  );
};
