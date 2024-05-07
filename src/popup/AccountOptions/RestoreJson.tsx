import React, { useContext, useState } from "react";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

import { ActionContext } from "../contexts";
import { batchRestore, jsonRestore } from "../messaging";
import { SectionTitle } from "../components/SectionTitle";
import { ErrorMessage } from "../components/ErrorMessage";
import Uik from "@reef-chain/ui-kit";
import strings from "../../i18n/locales";
import { useTheme } from "../context/ThemeContext";

const enum Error {
  NONE,
  INVALID_JSON,
  INVALID_PASSWORD,
}

const isBatch = (json: any): boolean => {
  return json.encoding.content.includes("batch-pkcs8");
};

export const RestoreJson = (): JSX.Element => {
  const onAction = useContext(ActionContext);
  const [error, setError] = useState<Error>(Error.NONE);
  const [json, setJson] = useState<any>(null);
  const [accountsNumber, setAccountsNumber] = useState<number>();
  const [password, setPassword] = useState<string>("");

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result;
        if (typeof content === "string") {
          try {
            const json = JSON.parse(content);
            let accountsNumber = 0;
            if (isBatch(json)) {
              accountsNumber = json.accounts.length;
            } else if (json.address) {
              accountsNumber = 1;
            }
            if (accountsNumber > 0) {
              setAccountsNumber(accountsNumber);
              setJson(json);
              setError(Error.NONE);
            } else {
              setJson(null);
              setError(Error.INVALID_JSON);
            }
          } catch (e) {
            setJson(null);
            setError(Error.INVALID_JSON);
          }
        } else {
          setJson(null);
          setError(Error.INVALID_JSON);
        }
      };
      reader.readAsText(file);
    }
  };

  const restore = async () => {
    try {
      isBatch(json)
        ? await batchRestore(json, password)
        : await jsonRestore(json, password);
      onAction("/");
    } catch (e) {
      setError(Error.INVALID_PASSWORD);
    }
  };

  const { isDarkMode } = useTheme();
  return (
    <>
      <SectionTitle text={strings.restore_from_json} />
      <div className="text-left">
        <label className={isDarkMode ? "" : "text-black"}>{strings.backup_file}</label>
        <Uik.Input
          className="text-primary rounded-md w-full"
          type="file"
          onChange={(e) => {
            onFileChange(e);
          }}
        />
        {error === Error.INVALID_JSON && (
          <ErrorMessage text={strings.invalid_json} />
        )}
        {json && (
          <div className="mt-1">
            <FontAwesomeIcon
              className="mr-2 text-green-500"

              icon={faCircleCheck as IconProp}
            />
            <span className="text-gray-300">
              {accountsNumber}
              {accountsNumber > 1 ? " accounts " : " account "} {strings.to_be_restored}
            </span>
          </div>
        )}
      </div>
      {json && (
        <div className="flex flex-col items-start my-4">
          <label>{strings.pass_for_file}</label>
          <Uik.Input
            className="text-primary rounded-md p-2 w-full"
            value={password}
            type="password"
            onChange={(e) => setPassword(e.target.value)}
          />
          {error === Error.INVALID_PASSWORD && (
            <ErrorMessage text={strings.unable_to_decode} />
          )}
        </div>
      )}
      <button
        className="mt-6 py-3 hover:cursor-pointer"
        onClick={() => restore()}
        disabled={!password || !json}
      >
        {strings.restore}
      </button>
    </>
  );
};
