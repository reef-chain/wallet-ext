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
      <div className="mt-4 mb-2">
        <span className="text-lg font-bold">Manage website access</span>
      </div>
      <div>
        {!authList || !Object.entries(authList)?.length ? (
          <div>No website request yet!</div>
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
