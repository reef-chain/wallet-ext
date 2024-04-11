// Adapted from @polkadot/extension-ui (https://github.com/polkadot-js/extension)
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import { useLocation } from "react-router";
import { SectionTitle } from "./components/SectionTitle";

export const PhishingDetected = (): JSX.Element => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const website = queryParams.get("url");
  const decodedWebsite = decodeURIComponent(website);

  return (
    <>
      <SectionTitle text="Phishing detected" />
      <div className="text-left">
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
