module Styles = {
  open CssJs

  let footer = style(. [
    fontSize(rem(0.75)),
    opacity(0.7),
    textAlign(#center),
    position(#absolute),
    left(#zero),
    right(#zero),
    bottom(px(20)),
    media(. "max-height: 500px", [display(#none)]),
    selector(.
      "a",
      [
        color(var("--theme-text-on-primary")),
        textDecoration(#none),
        hover([textDecoration(#underline)]),
        active([textDecoration(#underline)]),
        focus([textDecoration(#underline)]),
      ],
    ),
  ])
}

@react.component
let default = () => {
  <footer className={Styles.footer}>
    <p>
      {React.string("A project by ")}
      <a href="https://traviskaufman.io" target="_blank" rel="noopener noreferrer">
        {React.string("Travis Kaufman")}
      </a>
    </p>
  </footer>
}
