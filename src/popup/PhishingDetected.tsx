// Adapted from @polkadot/extension-ui (https://github.com/polkadot-js/extension)
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import { useLocation } from "react-router";
import { SectionTitle } from "./components/SectionTitle";
import strings from "../i18n/locales";

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
          {strings.redirected_due_to_phishing}
        </p>
        <p className="text-lg my-3 text-center">{decodedWebsite}</p>
        <p>
          {strings.community_flagged_phishing}{" "}
          <a
            className="underline"
            href="https://github.com/polkadot-js/phishing/issues/new"
          >
            {strings.please_open_issue}
          </a>
          .
        </p>
      </div>
    </>
  );
};
