// Adapted from @polkadot/extension-ui (https://github.com/polkadot-js/extension)
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import { useLocation } from "react-router";

export const PhishingDetected = (): JSX.Element => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const website = queryParams.get("url");
  const decodedWebsite = decodeURIComponent(website);

  return (
    <>
      <div className="mt-4 mb-2">
        <span className="text-lg font-bold">Phishing detected</span>
      </div>
      <div className="text-justify">
        <p>
          You have been redirected because Reef extension believes that this
          website could compromise the security of your accounts and your
          tokens.
        </p>
        <p className="text-lg my-3 text-center">{decodedWebsite}</p>
        <p>
          Note that this website was reported on a community-driven, curated
          list. It might be incomplete or inaccurate. If you think that this
          website was flagged incorrectly,{" "}
          <a
            className="underline"
            href="https://github.com/polkadot-js/phishing/issues/new"
          >
            please open an issue by clicking here
          </a>
          .
        </p>
      </div>
    </>
  );
};
