module Styles = {
  open CssJs

  let time = style(. [
    fontSize(rem(12.)),
    media(. "(max-width: 720px)", [fontSize(rem(6.))]),
    fontWeight(#num(300)),
    lineHeight(#abs(1.)),
    letterSpacing(rem(-0.015)),
    margin2(~v=px(20), ~h=auto),
  ])
}

@react.component
let default = (~formattedSeconds: string) => {
  <time className=Styles.time dateTime=formattedSeconds> {React.string(formattedSeconds)} </time>
}
