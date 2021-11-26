module Styles = {
  open CssJs

  let nav = style(. [
    position(absolute),
    top(px(20)),
    left(px(20)),
    display(#flex),
    flexDirection(column),
    media(. "(max-width: 600px)", [flexDirection(row)]),
    alignItems(center),
    justifyContent(center),
  ])
}

@react.component
let default = (~children: React.element) => {
  <nav className=Styles.nav> children </nav>
}
