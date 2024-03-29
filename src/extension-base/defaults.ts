// Adapted from @polkadot/extension-base (https://github.com/polkadot-js/extension)
// SPDX-License-Identifier: Apache-2.0

const PKG_VERSION = "0.0.0-DEV";
const PORT_CONTENT = "reef_content";
const PHISHING_PAGE_REDIRECT = "phishing-detected";
const PORT_EXTENSION = "reef_extension";
const PORT_PAGE = "reef_page";
const PASSWORD_EXPIRY_MIN = 15;
const PASSWORD_EXPIRY_MS = PASSWORD_EXPIRY_MIN * 60 * 1000;

export {
  PKG_VERSION,
  PHISHING_PAGE_REDIRECT,
  PORT_CONTENT,
  PORT_EXTENSION,
  PORT_PAGE,
  PASSWORD_EXPIRY_MIN,
  PASSWORD_EXPIRY_MS,
};
