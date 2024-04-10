import React, { useContext, useState } from "react";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { saveAs } from "file-saver";

import { ActionContext } from "../contexts";
import { exportAllAccounts } from "../messaging";
import { SectionTitle } from "../SectionTitle";

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
        <div className="flex my-3 border-l-primary border-l-4 pl-2">
          <FontAwesomeIcon
            className="text-primary mr-2 pt-1"
            icon={faExclamationTriangle as IconProp}
          />
          <span className="text-left text-gray-300">
            You are exporting your accounts. Keep it safe and don't share it
            with anyone. Password must be at least 6 characters long.
          </span>
        </div>
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
            <div className="text-red-500 mt-1">
              <FontAwesomeIcon
                className="mr-2"
                icon={faExclamationTriangle as IconProp}
              />
              <span>Password is too short</span>
            </div>
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
              <div className="text-red-500 mt-1">
                <FontAwesomeIcon
                  className="mr-2"
                  icon={faExclamationTriangle as IconProp}
                />
                <span>Passwords do not match</span>
              </div>
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
