// Generated by ReScript, PLEASE EDIT WITH CARE

import * as CssJs from "bs-css-emotion/src/CssJs.js";
import * as React from "react";

var appUI = CssJs.style([
      CssJs.display("flex"),
      CssJs.alignItems(CssJs.center),
      CssJs.justifyContent(CssJs.center),
      CssJs.flexDirection(CssJs.column)
    ]);

var Styles = {
  appUI: appUI
};

function AppUI$default(Props) {
  var children = Props.children;
  return React.createElement("main", {
              className: appUI
            }, children);
}

var $$default = AppUI$default;

export {
  Styles ,
  $$default ,
  $$default as default,
  
}
/* appUI Not a pure module */