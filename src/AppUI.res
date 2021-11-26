module Styles = {
  open CssJs

  let appUI = style(. [
    display(#flex),
    alignItems(center),
    justifyContent(center),
    flexDirection(column),
  ])
}

@react.component
let default = (~children: React.element) => {
  <main className=Styles.appUI> children </main>
}
