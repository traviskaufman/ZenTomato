/** @jsx jsx */
import { useReducer, useEffect, useRef } from "react";
import { css, jsx } from "@emotion/core";
import { ThemeProvider } from "emotion-theming";
import { ReactComponent as Play } from "./assets/Play.svg";
import { ReactComponent as Pause } from "./assets/Pause.svg";
import { ReactComponent as Stop } from "./assets/Stop.svg";
import useStableInterval from "./hooks/use-stable-interval";
import LogoImage from "./LogoImage";
import Footer from "./Footer";
import TimeDisplay from "./TimeDisplay";
import AppContainer from "./AppContainer";
import NotificationSettings, {
  Model as NotificationSettingsModel,
} from "./NotificationSettings";
import Nav from "./Nav";
import AppUI from "./AppUI";

const DEBUG = process.env.NODE_ENV !== "production" && /* change this */ true;
const SUPPORTS_NOTIFS = "Notification" in window;

const cssHelpers = {
  btnReset: css`
    background: none;
    border: none;
    appearance: none;
    cursor: pointer;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  `,
  hover: css`
    @media (hover: hover) {
      &:hover {
        transform: scale(1.08);
      }
    }
  `,
};

const styles = {
  controls: css`
    display: flex;
    align-items: center;
    z-index: 1;
  `,
  control: css`
    ${cssHelpers.btnReset};
    ${cssHelpers.hover};
    transition: transform 125ms ease, opacity 125ms ease;
    opacity: 1;
    cursor: pointer;
    margin-right: 24px;
    &:last-child {
      margin-right: 0;
    }

    &:disabled {
      opacity: 0.54;
      pointer-events: none;
    }
  `,
  segmentBar: (theme) => css`
    box-sizing: border-box;
    border-radius: 8px;
    width: 100%;
    height: 48px;
    border: 1px solid ${theme.secondary};
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 1;
    overflow: hidden;
  `,
  segmentControl: (isSelected) => (theme) =>
    css`
      ${cssHelpers.btnReset}
      text-align: center;
      background-color: rgba(255, 255, 255, ${isSelected ? 1 : 0});
      color: ${isSelected ? theme.textOnSecondary : theme.textOnPrimary};
      border-right: 1px solid ${theme.textOnPrimary};
      display: block;
      width: 100%;
      height: 100%;
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
      letter-spacing: 0.5;
      transition: color 125ms ease, background-color 125ms ease;

      &:last-child {
        border-right: none;
      }

      &:hover,
      &.focus-visible {
        background-color: rgba(255, 255, 255, ${isSelected ? 1 : 0.4});
      }
      ${isSelected
        ? css`
            &.focus-visible {
              background-color: ${theme.textOnSecondary};
              color: ${theme.textOnPrimary};
            }
          `
        : ""}
    `,
};

let originalTitle = document.title;
let INITIAL_STATE = {
  // TODO: Refactor secondsRemaining and clockStatus into `clock` variable
  secondsRemaining: durationForCycle("pomodoro"),
  clockStatus: "stopped",
  // TODO: Progressively degrade if not active.
  notifications: {
    isRequestingAccess: false,
    // TODO: Find a way to know if someone disables permissions in settings.
    enabled:
      SUPPORTS_NOTIFS && Boolean(localStorage.getItem("notificationsEnabled")),
    shownForCycle: false,
  },
  pomodoro: {
    currentCycle: "pomodoro",
  },
  theme: {
    primary: "#f06b50",
    secondary: "#fff",
    textOnPrimary: "#fff",
    textOnSecondary: "#121212",
  },
};

function durationForCycle(cycle) {
  switch (cycle) {
    case "pomodoro":
      return DEBUG ? 3 : 25 * 60;
    case "shortBreak":
      return DEBUG ? 3 : 5 * 60;
    case "longBreak":
      return DEBUG ? 3 : 15 * 60;
    default:
      throw new Error(`Unexpected cycle ${cycle}`);
  }
}

const RUN_KEY = "runningUnloadInfo";
function catchUnload(state) {
  if (state.clockStatus === "running") {
    localStorage.setItem(
      RUN_KEY,
      JSON.stringify({
        timeUnloaded: Date.now(),
        state,
      })
    );
  }
}

if (RUN_KEY in localStorage) {
  try {
    const unloadInfo = JSON.parse(localStorage.getItem(RUN_KEY));
    const unloadHappenedLessThan10sAgo =
      Date.now() - unloadInfo.timeUnloaded < 10000;
    if (unloadHappenedLessThan10sAgo) {
      INITIAL_STATE = unloadInfo.state;
    }
  } catch (err) {
    console.warn("Could not restore state from previous session:", err);
  } finally {
    localStorage.removeItem(RUN_KEY);
  }
}

// TODO: Pulsate play button (or some indication when initially loaded)
// TODO: Starry constellation
// TODO: Keyboard shortcuts
function App() {
  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      // For now these are the same, but semantically they are different,
      // so I will separate them.
      case "play":
        const wasPaused = state.clockStatus === "paused";
        return {
          ...state,
          clockStatus: "running",
          secondsRemaining: wasPaused
            ? state.secondsRemaining
            : durationForCycle(state.pomodoro.currentCycle),
          notifications: {
            ...state.notifications,
            shownForCycle: false,
          },
        };
      case "tick":
        const newSecondsRemaining = state.secondsRemaining - 1;
        // For some reason, only when tabs are in the background, setInterval an additional time.
        // I have no idea why this happens, whether or not it's a React bug, a browser bug, or something else.
        // ...but I intend to find out why.
        if (newSecondsRemaining < 0) {
          return state;
        }
        const isFinished = newSecondsRemaining === 0;
        let newState = {
          ...state,
          secondsRemaining: newSecondsRemaining,
          clockStatus: isFinished ? "finished" : state.clockStatus,
        };
        return newState;
      case "pause":
        return {
          ...state,
          clockStatus: "paused",
        };
      case "stop":
        if (state.clockStatus === "finished") return state;
        return {
          ...state,
          secondsRemaining: durationForCycle(state.pomodoro.currentCycle),
          clockStatus: "stopped",
          notifications: {
            ...state.notifications,
            shownForCycle: false,
          },
        };
      case "notificationSeen":
        return {
          ...state,
          notifications: {
            ...state.notifications,
            shownForCycle: true,
          },
        };
      case "selectCycle":
        // TODO: If the clock state is finished, immediately start.
        return {
          ...state,
          secondsRemaining: durationForCycle(action.payload),
          clockStatus: "stopped",
          pomodoro: {
            ...state.pomodoro,
            currentCycle: action.payload,
          },
          theme: {
            ...state.theme,
            primary:
              action.payload === "pomodoro"
                ? "#f06b50"
                : action.payload === "shortBreak"
                ? "#0e4ead"
                : "#07093d",
            textOnSecondary:
              action.payload === "longBreak" ? "#107fc9" : "#121212",
          },
          notifications: {
            ...state.notifications,
            shownForCycle: false,
          },
        };
      default:
        throw new Error(`Unrecognized action ${action.type}`);
    }
  }, INITIAL_STATE);

  useStableInterval(
    () => {
      dispatch({ type: "tick" });
    },
    state.clockStatus === "running" ? 1000 : null
  );

  // TODO: Def a selector
  const formattedSeconds = (() => {
    let minutes = String(Math.floor(state.secondsRemaining / 60));
    let seconds = String(state.secondsRemaining % 60);
    if (minutes < 10) {
      minutes = `0${minutes}`;
    }
    if (seconds < 10) {
      seconds = `0${seconds}`;
    }
    return `${minutes}:${seconds}`;
  })();

  useEffect(() => {
    const catchUnloadForState = () => catchUnload(state);
    window.addEventListener("unload", catchUnloadForState);
    return () => window.removeEventListener("unload", catchUnloadForState);
  }, [state]);

  useEffect(() => {
    switch (state.clockStatus) {
      case "running":
        document.title = `(${formattedSeconds}) ZenTomato`;
        break;
      case "paused":
        document.title = `⏸(${formattedSeconds}) ZenTomato`;
        break;
      case "finished":
        document.title = `🏁✅ ZenTomato`;
        break;
      default:
        document.title = originalTitle;
        break;
    }
  }, [formattedSeconds, state.clockStatus]);

  const notificationsEnabled = NotificationSettingsModel.useIsEnabled();
  useEffect(() => {
    if (
      state.clockStatus === "finished" &&
      notificationsEnabled &&
      !state.notifications.shownForCycle
    ) {
      const finishingPomodoro = state.pomodoro.currentCycle === "pomodoro";
      const notification = new Notification(
        `Your ${finishingPomodoro ? "pomodoro" : "break"} is over 😌`,
        {
          icon: `${process.env.PUBLIC_URL}/logo192.png`,
          body: `${
            finishingPomodoro
              ? "Take a short break"
              : "Begin your next pomodoro"
          } when ready`,
        }
      );
      const timer = setTimeout(() => notification.close(), 5000);
      notification.onclose = () => clearTimeout(timer);
      dispatch({ type: "notificationSeen" });
    }
  }, [
    state.clockStatus,
    notificationsEnabled,
    state.notifications.shownForCycle,
    state.pomodoro.currentCycle,
  ]);

  const playPauseBtn = useRef();
  useEffect(() => {
    if (playPauseBtn.current) {
      playPauseBtn.current.focus();
    }
  }, []);

  useEffect(() => {
    let root = document.querySelector(":root");
    root.style.setProperty("--theme-primary", state.theme.primary);
    root.style.setProperty("--theme-secondary", state.theme.secondary);
    root.style.setProperty(
      "--theme-text-on-primary",
      state.theme.textOnPrimary
    );
    root.style.setProperty(
      "--theme-text-on-secondary",
      state.theme.textOnSecondary
    );
  }, [state.theme]);

  const handlePlay = () => {
    dispatch({ type: "play" });
    // Tick right away to let users know somethings happening
    dispatch({ type: "tick" });
  };

  const handlePause = () => dispatch({ type: "pause" });

  const handleStop = () => dispatch({ type: "stop" });

  const selectCycle = (cycle) => {
    dispatch({ type: "selectCycle", payload: cycle });
    if (state.clockStatus === "finished") {
      dispatch({ type: "play" });
      dispatch({ type: "tick" });
    }
  };

  const isRunning = state.clockStatus === "running";

  const currentCycle = state.pomodoro.currentCycle;

  return (
    <ThemeProvider theme={state.theme}>
      <AppContainer>
        <Nav>
          <LogoImage />
          <NotificationSettings />
        </Nav>
        <AppUI>
          <section css={styles.segmentBar}>
            <button
              css={styles.segmentControl(currentCycle === "pomodoro")}
              onClick={() => selectCycle("pomodoro")}
            >
              Pomodoro
            </button>
            <button
              css={styles.segmentControl(currentCycle === "shortBreak")}
              onClick={() => selectCycle("shortBreak")}
            >
              Short break
            </button>
            <button
              css={styles.segmentControl(currentCycle === "longBreak")}
              onClick={() => selectCycle("longBreak")}
            >
              Long break
            </button>
          </section>
          <TimeDisplay formattedSeconds={formattedSeconds} />
          <div css={styles.controls}>
            <button
              aria-label={isRunning ? "Pause" : "Start"}
              css={styles.control}
              onClick={isRunning ? handlePause : handlePlay}
              ref={playPauseBtn}
            >
              {isRunning ? <Pause /> : <Play />}
            </button>
            <button
              aria-label="Stop"
              css={styles.control}
              disabled={
                state.clockStatus === "stopped" ||
                state.clockStatus === "finished"
              }
              onClick={handleStop}
            >
              <Stop />
            </button>
          </div>
        </AppUI>
        <Footer />
      </AppContainer>
    </ThemeProvider>
  );
}

export default App;
