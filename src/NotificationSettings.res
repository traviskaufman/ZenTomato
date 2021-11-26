%%raw(`
  import {ReactComponent as NotificationBellSVG} from './assets/notificationBell.svg';
`)

module NotificationBell = {
  @react.component @val
  external make: (~className: string, ~title: string) => React.element = "NotificationBellSVG"
}

%%private(
  let supportsNotifications: bool = %raw(`
    "Notification" in window
  `)
)

module Model = {
  %%private(
    let enabled = Recoil.atomWithEffects({
      key: "NotificationSettings.Model.enabled",
      default: false,
      effects_UNSTABLE: [
        ({onSet}) => {
          open Dom.Storage2
          onSet((~newValue as isEnabled, ~oldValue as _, ~isReset as _) =>
            switch isEnabled {
            | true => localStorage->setItem("notificationsEnabled", "you betcha!")
            | false => localStorage->removeItem("notificationsEnabled")
            }
          )
          None
        },
      ],
    })
  )

  %%private(
    let useRunPermissionFlow = () => {
      let (enabled, setEnabled) = Recoil.useRecoilState(enabled)
      () => {
        setEnabled(_ => !enabled)
        Notifications.Notification.requestPermission()->Js.Promise.then_(permission => {
          if permission === "denied" {
            Webapi.Dom.Window.alert(
              "Notifications have been disabled for ZenTomato. You can re-enable them in your browser's settings.",
              Webapi.Dom.window,
            )
          }
          setEnabled(_ => permission === "granted")
          Js.Promise.resolve()
        }, _)->ignore
      }
    }
  )

  let useIsEnabled = () => {
    let (enabled, _) = Recoil.useRecoilState(enabled)
    enabled
  }

  let useAttemptToggleNotifications = () => {
    let (_, setEnabled) = Recoil.useRecoilState(enabled)
    let runPermissionFlow = useRunPermissionFlow()
    () => {
      if supportsNotifications {
        switch Notifications.Notification.permission {
        | "granted" => setEnabled(isEnabled => !isEnabled)
        | _ => runPermissionFlow()->ignore
        }
      } else {
        ignore()
      }
    }
  }
}

module Styles = {
  open CssJs

  let notificationButton = merge(. [
    CssHelpers.btnReset,
    CssHelpers.hover,
    style(. [
      cursor(#pointer),
      transition("transform", ~duration=125, ~timingFunction=ease),
      marginBottom(px(20)),
      selector(. "&:last-child", [marginBottom(zero)]),
      media(.
        "(max-width: 600px)",
        [marginBottom(zero), marginRight(px(20)), selector(. "&:last-child", [marginRight(zero)])],
      ),
    ]),
  ])

  let notificationBell = enabled =>
    style(. [
      selector(.
        "#bell",
        [
          transition("fill", ~duration=125, ~timingFunction=ease),
          SVG.fill(
            if enabled {
              var("--theme-text-on-primary")
            } else {
              none
            },
          ),
        ],
      ),
      marginRight(px(8)),
    ])
}

@react.component
let default = () => {
  let notificationsEnabled = Model.useIsEnabled()
  let attemptToggleNotifications = Model.useAttemptToggleNotifications()

  <button
    className=Styles.notificationButton
    ariaLabel={(notificationsEnabled ? "Disable" : "Enable") ++ " notifications"}
    onClick={_ => attemptToggleNotifications()}
    hidden={!supportsNotifications}>
    <NotificationBell
      className={Styles.notificationBell(notificationsEnabled)}
      title={(notificationsEnabled ? "Disable" : "Enable") ++ " notifications"}
    />
  </button>
}
