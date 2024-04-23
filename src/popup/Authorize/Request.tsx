// Adapted from @polkadot/extension-ui (https://github.com/polkadot-js/extension)
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback } from "react";

import { approveAuthRequest, rejectAuthRequest } from "../messaging";
import { RequestAuthorizeTab } from "../../extension-base/background/types";
import { WarnMessage } from "../components/WarnMessage";
import Uik from "@reef-chain/ui-kit";

interface Props {
  authId: string;
  request: RequestAuthorizeTab;
  url: string;
}

function Request({
  authId,
  request: { origin },
  url,
}: Props): React.ReactElement<Props> {
  const _onApprove = useCallback(
    () =>
      approveAuthRequest(authId).catch((error: Error) => console.error(error)),
    [authId]
  );

  const _onReject = useCallback(
    () =>
      rejectAuthRequest(authId).catch((error: Error) => console.error(error)),
    [authId]
  );

  return (
    <>
      <div className="text-left">
        An application, self-identifying as <span className="">{origin}</span>{" "}
        is requesting access from{" "}
        <a href={url} target="_blank" className="underline">
          <span className="">{url}</span>
        </a>
        .
      </div>
      <WarnMessage text="Only approve this request if you trust the application. Approving gives the application access to the addresses of your accounts." />
      <div>
        <Uik.Button onClick={_onApprove} text="Yes, allow this application access" fill />
        <Uik.Button onClick={_onReject} text="Reject" />
      </div>
    </>
  );
}

export default Request;
