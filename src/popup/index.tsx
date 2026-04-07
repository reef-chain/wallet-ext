import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "../assets/tailwind.css";
import Popup from "./popup";
import { ThemeProvider } from "./context/ThemeContext";
import { HideBalanceProvider } from "./context/HideBalance";
import { FormoAnalyticsProvider } from '@formo/analytics';

function init() {
  const appContainer = document.createElement("div");
  appContainer.className = "popup-container";
  document.body.appendChild(appContainer);

  if (!appContainer) {
    throw new Error("Can not find AppContainer");
  }
  const root = createRoot(appContainer);
  console.log(appContainer);
  root.render(
    <FormoAnalyticsProvider writeKey="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmlnaW4iOiJodHRwczovL3JlZWYuaW8iLCJwcm9qZWN0X2lkIjoid2lsMGJMR1NrUURucWx4TDc4bHgyIiwiaWF0IjoxNzY1OTgyNDI5fQ.aPap3ykS2g1QFg1roeTWrSv7XO47tnh6fl7-xo1NyVQ">
      <HideBalanceProvider>
        <ThemeProvider>
          <HashRouter>
            <Popup />
          </HashRouter>
        </ThemeProvider>
      </HideBalanceProvider>
    </FormoAnalyticsProvider>
  );
}

init();
