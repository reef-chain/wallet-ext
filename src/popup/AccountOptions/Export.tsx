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
import strings from "../../i18n/locales";

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
      <SectionTitle text={strings.export_acc} />
      <div className="flex flex-col">
        {account && <Account account={{ ...account }} showCopyAddress={true} />}
        <WarnMessage text={strings.you_are_exporting_account} />
        <div className="flex flex-col items-start my-3">
          <label>{strings.password_for_this_acc}</label>
          <Uik.Input
            className="text-primary rounded-md p-2 w-full"
            value={password}
            type="password"
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
          />
          {error && <ErrorMessage text={strings.pass_not_correct} />}
        </div>
        <Uik.Button text={strings.export_acc} onClick={() => exportOne()}
          disabled={!password || error !== ""} />
      </div>
    </>
  );
};
