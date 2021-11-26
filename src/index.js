import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import "focus-visible";
import { RecoilRoot } from "recoil";

ReactDOM.render(
  <RecoilRoot>
    <App />
  </RecoilRoot>,
  document.getElementById("root")
);
document.documentElement.classList.add("app-loaded");
