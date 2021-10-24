@module("./assets/logo.svg") external logo: string = "default"

@react.component
let default = () => {
  <img
    style={ReactDOM.Style.make(~marginBottom="20px", ~opacity="0.7", ())}
    src={logo}
    alt="Zen Tomato – A project by Travis Kaufman"
    width="96"
    height="96"
  />
}
