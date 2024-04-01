import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "../assets/tailwind.css";
import Popup from "./popup";

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
    <HashRouter>
      <Popup />
    </HashRouter>
  );
}

init();
