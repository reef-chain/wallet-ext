// Adapted from @polkadot/extension-ui (https://github.com/polkadot-js/extension)
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useEffect, useState } from "react";
import type { SignerPayloadJSON } from "@polkadot/types/types";

import { SigningRequest } from "../../extension-base/background/types";
import Request from "./Request";
import RequestIndex from "../RequestIndex";
import Account from "../Accounts/Account";

interface Props {
  requests: SigningRequest[];
}

export const Signing = ({ requests }: Props): JSX.Element => {
  const [requestIndex, setRequestIndex] = useState(0);
  const [isTransaction, setIsTransaction] = useState(false);

  const _onNextClick = useCallback(
    () => setRequestIndex((requestIndex) => requestIndex + 1),
    []
  );

  const _onPreviousClick = useCallback(
    () => setRequestIndex((requestIndex) => requestIndex - 1),
    []
  );

  useEffect(() => {
    setRequestIndex((requestIndex) =>
      requestIndex < requests.length ? requestIndex : requests.length - 1
    );
  }, [requests]);

  useEffect(() => {
    const isTransaction = !!(
      requests[requestIndex]?.request?.payload as SignerPayloadJSON
    )?.blockNumber;
    setIsTransaction(isTransaction);
  }, [requestIndex]);

  return requests.length && requests[requestIndex] ? (
    <>
      <div className="text-center text-lg font-bold">
        <span>{isTransaction ? "Transaction" : "Sign message"}</span>
        {requests.length > 1 && (
          <RequestIndex
            index={requestIndex}
            onNextClick={_onNextClick}
            onPreviousClick={_onPreviousClick}
            totalItems={requests.length}
          />
        )}
      </div>
      <Account account={requests[requestIndex].account} />
      <Request
        account={requests[requestIndex].account}
        buttonText={isTransaction ? "Sign the transaction" : "Sign the message"}
        isFirst={requestIndex === 0}
        request={requests[requestIndex].request}
        signId={requests[requestIndex].id}
        url={requests[requestIndex].url}
      />
    </>
  ) : (
    <span>Loading signature requests...</span>
  );
};
