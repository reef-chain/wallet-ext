// Adapted from @polkadot/extension-ui (https://github.com/polkadot-js/extension)
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback } from "react";

import { approveAuthRequest, rejectAuthRequest } from "../messaging";
import { RequestAuthorizeTab } from "../../extension-base/background/types";
import { WarnMessage } from "../components/WarnMessage";

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
        <button onClick={_onApprove}>Yes, allow this application access</button>
        <button onClick={_onReject}>Reject</button>
      </div>
    </>
  );
}

export default Request;
