import React, { useContext, useState } from "react";
import { saveAs } from "file-saver";

import { ActionContext } from "../contexts";
import { exportAllAccounts } from "../messaging";
import { SectionTitle } from "../components/SectionTitle";
import { WarnMessage } from "../components/WarnMessage";
import { ErrorMessage } from "../components/ErrorMessage";

const enum Error {
  NONE,
  PASSWORD_TOO_SHORT,
  PASSWORDS_DO_NOT_MATCH,
}

export const ExportAll = (): JSX.Element => {
  const onAction = useContext(ActionContext);
  const [error, setError] = useState<Error>(Error.NONE);
  const [password, setPassword] = useState<string>("");
  const [passwordRepeat, setPasswordRepeat] = useState<string>("");
  const [passwordTouched, setPasswordTouched] = useState<boolean>(false);
  const [passwordRepeatTouched, setPasswordRepeatTouched] =
    useState<boolean>(false);

  const onPasswordChange = (password: string) => {
    setPassword(password);
    if (passwordTouched && password.length < 6) {
      setError(Error.PASSWORD_TOO_SHORT);
    } else {
      setError(Error.NONE);
    }
  };

  const onPasswordBlur = () => {
    setPasswordTouched(true);
    if (password.length < 6) {
      setError(Error.PASSWORD_TOO_SHORT);
    } else {
      setError(Error.NONE);
    }
  };

  const onPasswordRepeatChange = (passwordRepeat: string) => {
    setPasswordRepeat(passwordRepeat);
    if (passwordRepeatTouched && password !== passwordRepeat) {
      setError(Error.PASSWORDS_DO_NOT_MATCH);
    } else {
      setError(Error.NONE);
    }
  };

  const onPasswordRepeatBlur = () => {
    setPasswordRepeatTouched(true);
    if (password !== passwordRepeat) {
      setError(Error.PASSWORDS_DO_NOT_MATCH);
    } else {
      setError(Error.NONE);
    }
  };

  const exportAll = async () => {
    try {
      const exportedJson = await exportAllAccounts(password);
      const blob = new Blob([JSON.stringify(exportedJson)], {
        type: "application/json; charset=utf-8",
      });
      saveAs(blob, `batch_exported_account_${Date.now()}.json`);
      onAction("/");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <SectionTitle text="Export all accounts" />
      <div className="flex flex-col">
        <WarnMessage
          text="You are exporting your accounts. Keep it safe and don't share it with anyone. 
                Password must be at least 6 characters long."
        />
        <div className="flex flex-col items-start my-3">
          <label className="text-base">
            Password for encrypting all accounts
          </label>
          <input
            className="text-primary rounded-md p-2 w-full"
            value={password}
            type="password"
            onChange={(e) => onPasswordChange(e.target.value)}
            onBlur={() => {
              onPasswordBlur();
            }}
          />
          {error === Error.PASSWORD_TOO_SHORT && (
            <ErrorMessage text="Password is too short" />
          )}
        </div>
        {password.length >= 6 && (
          <div className="flex flex-col items-start">
            <label className="text-base">Repeat password</label>
            <input
              className="text-primary rounded-md p-2 w-full"
              value={passwordRepeat}
              type="password"
              onChange={(e) => onPasswordRepeatChange(e.target.value)}
              onBlur={() => {
                onPasswordRepeatBlur();
              }}
            />
            {error === Error.PASSWORDS_DO_NOT_MATCH && (
              <ErrorMessage text="Passwords do not match" />
            )}
          </div>
        )}
        <button
          className="mt-4 py-3 hover:cursor-pointer"
          onClick={() => exportAll()}
          disabled={
            password === passwordRepeat &&
            passwordRepeat.length > 5 &&
            error === Error.NONE
              ? false
              : true
          }
        >
          Export all my accounts
        </button>
      </div>
    </>
  );
};
