module Theme = {
  let textOnPrimary = #var("--theme-text-on-primary")
}

module Styles = {
  open CssJs

  let appContainer = style(. [
    width(#vw(100.)),
    height(#vh(100.)),
    display(#flex),
    alignItems(#center),
    justifyContent(#center),
    flexDirection(#column),
    color(Theme.textOnPrimary),
  ])
}

@react.component
let default = (~children: React.element) => {
  <div className=Styles.appContainer> children </div>
}
