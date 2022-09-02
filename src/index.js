import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./components/App";

import "./index.css";

const rootElement = document.getElementById("app");

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
