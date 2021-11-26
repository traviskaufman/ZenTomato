module Styles = {
  open CssJs

  let cycleControls = style(. [
    boxSizing(borderBox),
    borderRadius(px(8)),
    width(pct(100.)),
    height(px(48)),
    border(px(1), solid, var("--theme-secondary")),
    display(#flex),
    alignItems(center),
    justifyContent(spaceBetween),
    zIndex(1),
    overflow(hidden),
  ])
}

@react.component
let default = (~children: React.element) => {
  <section className=Styles.cycleControls> children </section>
}
