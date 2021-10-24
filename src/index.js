import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import "focus-visible";

ReactDOM.render(<App />, document.getElementById("root"));
document.documentElement.classList.add("app-loaded");
