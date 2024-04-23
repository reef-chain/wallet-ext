// Adapted from @polkadot/extension-ui (https://github.com/polkadot-js/extension)
// SPDX-License-Identifier: Apache-2.0

import React, { useEffect, useState } from "react";
import { TypeRegistry } from "@polkadot/types";
import type { ExtrinsicPayload } from "@polkadot/types/interfaces";
import type {
  SignerPayloadJSON,
  SignerPayloadRaw,
} from "@polkadot/types/types";
import { extension as extLib } from "@reef-chain/util-lib";

import { RequestSign } from "../../extension-base/background/types";
import Bytes from "./Bytes";
import Extrinsic from "./Extrinsic";
import {
  approveSignRequest,
  cancelSignRequest,
  isSignLocked,
} from "../messaging";
import { PASSWORD_EXPIRY_MIN } from "../../extension-base/defaults";
import { ErrorMessage } from "../components/ErrorMessage";
import { Loading } from "../components/Loading";
import Uik from "@reef-chain/ui-kit";

interface Props {
  account: extLib.AccountJson;
  buttonText: string;
  isFirst: boolean;
  request: RequestSign;
  signId: string;
  url: string;
}

interface Data {
  hexBytes: string | null;
  payload: ExtrinsicPayload | null;
}

// keep it global, we can and will re-use this across requests
const registry = new TypeRegistry();

function isRawPayload(
  payload: SignerPayloadJSON | SignerPayloadRaw
): payload is SignerPayloadRaw {
  return !!(payload as SignerPayloadRaw).data;
}

export default function Request({
  buttonText,
  isFirst,
  request,
  signId,
  url,
}: Props): React.ReactElement<Props> | null {
  const [password, setPassword] = useState<string>("");
  const [savePass, setSavePass] = useState(false);
  const [isLocked, setIsLocked] = useState<boolean | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [{ hexBytes, payload }, setData] = useState<Data>({
    hexBytes: null,
    payload: null,
  });

  useEffect((): void => {
    setIsLocked(null);
    let timeout: NodeJS.Timeout;

    isSignLocked(signId)
      .then(({ isLocked, remainingTime }) => {
        setIsLocked(isLocked);
        timeout = setTimeout(() => {
          setIsLocked(true);
        }, remainingTime);

        // if the account was unlocked check the remember me
        // automatically to prolong the unlock period
        !isLocked && setSavePass(true);
      })
      .catch((error: Error) => console.error(error));

    () => {
      !!timeout && clearTimeout(timeout);
    };

    const payload = request.payload;

    if (isRawPayload(payload)) {
      setData({
        hexBytes: payload.data,
        payload: null,
      });
    } else {
      registry.setSignedExtensions(payload.signedExtensions);

      setData({
        hexBytes: null,
        payload: registry.createType("ExtrinsicPayload", payload, {
          version: payload.version,
        }),
      });
    }
  }, [request]);

  const _onSign = async () => {
    setIsBusy(true);

    if (isLocked) {
      if (!password) {
        setIsBusy(false);
        setError("Password not provided");
        return;
      }
    }

    return approveSignRequest(signId, savePass, password)
      .then((): void => {
        setIsBusy(false);
      })
      .catch((error: Error): void => {
        setIsBusy(false);
        console.error(error);
        setError(error.message);
      });
  };

  const _onCancel = () => {
    cancelSignRequest(signId);
  };

  return (
    <>
      {payload !== null ? (
        <Extrinsic
          payload={payload}
          request={request.payload as SignerPayloadJSON}
          url={url}
        />
      ) : hexBytes !== null ? (
        <Bytes bytes={hexBytes} url={url} />
      ) : null}
      <div>
        {isFirst && isLocked && (
          <div className="mt-2">
            <div className="flex flex-col items-start my-3">
              <label>Password for this account</label>
              <Uik.Input
                className="text-primary rounded-md p-2 w-full"
                value={password}
                type="password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex align-middle items-center">
              <Uik.Checkbox
                value={savePass}
                onChange={(_) => setSavePass(!savePass)}
                disabled={isBusy}
              />
              <span className="font-bold ml-2">
                Remember for the next {PASSWORD_EXPIRY_MIN} minutes.
              </span>
            </div>
            {error && <ErrorMessage text={error} />}
            {isBusy && <Loading text="Processing..." />}
          </div>
        )}
        <div className="flex">
          {isFirst && (
            <Uik.Button text={buttonText} onClick={_onSign} disabled={isBusy} fill />
          )}
          <Uik.Button text="Cancel" onClick={_onCancel} disabled={isBusy} />
        </div>
      </div>
    </>
  );
}
