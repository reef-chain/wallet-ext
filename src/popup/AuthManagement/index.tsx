// Adapted from @polkadot/extension-ui (https://github.com/polkadot-js/extension)
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useEffect, useState } from "react";

import {
  getAuthList,
  removeAuthorization,
  toggleAuthorization,
} from "../messaging";
import { WebsiteEntry } from "./WebsiteEntry";
import {
  AuthUrlInfo,
  AuthUrls,
} from "../../extension-base/background/handlers/State";
import { SectionTitle } from "../components/SectionTitle";
import strings from "../../i18n/locales";

export const AuthManagement = (): JSX.Element => {
  const [authList, setAuthList] = useState<AuthUrls | null>(null);

  useEffect(() => {
    getAuthList()
      .then(({ list }) => setAuthList(list))
      .catch((e) => console.error(e));
  }, []);

  const toggleAuth = useCallback((url: string) => {
    toggleAuthorization(url)
      .then(({ list }) => setAuthList(list))
      .catch(console.error);
  }, []);

  const removeAuth = useCallback((url: string) => {
    removeAuthorization(url)
      .then(({ list }) => setAuthList(list))
      .catch(console.error);
  }, []);

  return (
    <>
      <SectionTitle text={strings.manage_website_access} />
      <div>
        {!authList || !Object.entries(authList)?.length ? (
          <div className="text-center">{strings.no_website_request_yet}</div>
        ) : (
          <>
            <div>
              {Object.entries(authList).map(
                ([url, info]: [string, AuthUrlInfo]) => (
                  <WebsiteEntry
                    info={info}
                    key={url}
                    toggleAuth={toggleAuth}
                    removeAuth={removeAuth}
                    url={url}
                  />
                )
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};
