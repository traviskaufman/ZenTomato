open CssJs

let btnReset = {
  style(. [
    background(#none),
    borderWidth(px(0)),
    cursor(#pointer),
    // This is missing. TODO: Add this
    unsafe("appearance", "none"),
    unsafe("WebkitTapHighlightColor", "rgba(0, 0, 0, 0)"),
  ])
}

let hover = {
  style(. [media(. "(hover: hover)", [selector(. "&:hover", [transform(#scale(1.08, 1.08))])])])
}
