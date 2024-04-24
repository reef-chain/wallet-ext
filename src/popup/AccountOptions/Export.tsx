import React, { useContext, useEffect, useState } from "react";
import { saveAs } from "file-saver";

import { AccountsContext, ActionContext } from "../contexts";
import { exportAccount } from "../messaging";
import { useParams } from "react-router";
import Account from "../Accounts/Account";
import { AccountWithSigner } from "../types";
import { SectionTitle } from "../components/SectionTitle";
import { WarnMessage } from "../components/WarnMessage";
import { ErrorMessage } from "../components/ErrorMessage";
import Uik from "@reef-chain/ui-kit";

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
      <SectionTitle text="Export account" />
      <div className="flex flex-col">
        {account && <Account account={{ ...account }} showCopyAddress={true} />}
        <WarnMessage text="You are exporting your account. Keep it safe and don't share it with anyone." />
        <div className="flex flex-col items-start my-3">
          <label>Password for this account</label>
          <Uik.Input
            className="text-primary rounded-md p-2 w-full"
            value={password}
            type="password"
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
          />
          {error && <ErrorMessage text="Password is not correct" />}
        </div>
        <Uik.Button text="Export Account" onClick={() => exportOne()}
          disabled={!password || error !== ""} />
      </div>
    </>
  );
};
