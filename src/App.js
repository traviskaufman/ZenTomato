/** @jsx jsx */
import { useReducer, useEffect, useRef } from 'react';
import useInterval from 'use-interval';
import { css, jsx } from '@emotion/core';
import { ThemeProvider } from 'emotion-theming';
// TODO: Icon fonts?
import logo from './logo.svg';
import { ReactComponent as NotificationBell } from './notificationBell.svg';
import { ReactComponent as Play } from './Play.svg';
import { ReactComponent as Pause } from './Pause.svg';
import { ReactComponent as Stop } from './Stop.svg';

const DEBUG = process.env.NODE_ENV !== 'production' && /* change this */ true;
const SUPPORTS_NOTIFS = 'Notification' in window;

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
  topMenu: css`
    position: absolute;
    top: 20px;
    left: 20px;
    display: flex;
    flex-direction: column;
    @media (max-width: 600px) {
      flex-direction: row;
    }
    align-items: center;
    justify-content: center;
  `,
  topMenuItem: css`
    ${cssHelpers.btnReset};
    ${cssHelpers.hover};
    cursor: pointer;
    /* TODO: Refactor with control */
    transition: transform 125ms ease;

    margin-bottom: 20px;
    &:last-child {
      margin-bottom: 0;
    }
    @media (max-width: 600px) {
      margin-bottom: 0;
      margin-right: 20px;
      &:last-child {
        margin-right: 0;
      }
    }
  `,
  time: css`
    /* TODO: Make this larger and scale with the size of the screen */
    font-size: 12rem;
    /* TODO: Refactor into smallScreen tagged template literal? */
    @media (max-width: 720px) {
      font-size: 6rem;
    }
    font-weight: 300;
    line-height: 1;
    letter-spacing: -.015rem;
    margin: 20px auto;
  `,
  appContainer: theme => css`
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    color: ${theme.textOnPrimary};
  `,
  appUI: css`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  `,
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
  segmentBar: theme => css`
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
  segmentControl: isSelected => theme => css`
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

    &:hover, &.focus-visible {
      background-color: rgba(255, 255, 255, ${isSelected ? 1 : 0.4});
    }
    ${isSelected ? css`
      &.focus-visible {
        background-color: ${theme.textOnSecondary};
        color: ${theme.textOnPrimary};
      }
    ` : ''}
  `,
  footer: theme => css`
    font-size: 0.75rem;
    opacity: 0.7;
    text-align: center;
    position: absolute;
    left: 0;
    right: 0;
    bottom: 20px;

    @media (max-height: 500px) {
      display: none;
    }

    a {
      color: ${theme.textOnPrimary};
      text-decoration: none;

      &:hover,
      &:active,
      &:focus {
        text-decoration: underline;
      }
    }
  `
}

let originalTitle = document.title;
let INITIAL_STATE = {
  // TODO: Refactor secondsRemaining and clockStatus into `clock` variable
  secondsRemaining: durationForCycle('pomodoro'),
  clockStatus: 'stopped',
  // TODO: Progressively degrade if not active.
  notifications: {
    isRequestingAccess: false,
    // TODO: Find a way to know if someone disables permissions in settings.
    enabled: SUPPORTS_NOTIFS && Boolean(localStorage.getItem('notificationsEnabled')),
  },
  pomodoro: {
    currentCycle: 'pomodoro',
  },
  theme: {
    primary: '#f06b50',
    secondary: '#fff',
    textOnPrimary: '#fff',
    textOnSecondary: '#121212',
  }
}

function durationForCycle(cycle) {
  switch (cycle) {
    case 'pomodoro':
      return DEBUG ? 3 : 25 * 60;
    case 'shortBreak':
      return DEBUG ? 3 : 5 * 60;
    case 'longBreak':
      return DEBUG ? 3 : 15 * 60;
    default:
      throw new Error(`Unexpected cycle ${cycle}`);
  }
}

// TODO: A11y and focus states on tab
// TODO: Focus on play button immediately
// TODO: Pulsate play button (or some indication when initially loaded)
function App() {
  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      // For now these are the same, but semantically they are different,
      // so I will separate them.
      case 'play':
        return {
          ...state,
          clockStatus: 'running',
        };
      case 'tick':
        let newSecondsRemaining = state.secondsRemaining - 1;
        const isFinished = newSecondsRemaining === 0;
        const isRestart = newSecondsRemaining < 0;
        let newState = {
          ...state,
          secondsRemaining: isRestart ? durationForCycle(state.pomodoro.currentCycle) - 1 : newSecondsRemaining,
          clockStatus: isFinished ? 'finished' : state.clockStatus,
        };
        return newState;
      case 'pause':
        return {
          ...state,
          clockStatus: 'paused'
        };
      case 'stop':
        if (state.clockStatus === 'finished') return state;
        return {
          ...state,
          secondsRemaining: durationForCycle(state.pomodoro.currentCycle),
          clockStatus: 'stopped',
        };
      case 'requestNotificationAccess':
        return {
          ...state,
          notifications: {
            ...state.notifications,
            isRequestingAccess: true,
          }
        };
      case 'setNotificationsEnabled':
        return {
          ...state,
          notifications: {
            ...state.notifications,
            isRequestingAccess: false,
            enabled: action.payload,
          },
        };
      case 'selectCycle':
        // TODO: If the clock state is finished, immediately start.
        return {
          ...state,
          secondsRemaining: durationForCycle(action.payload),
          clockStatus: 'stopped',
          pomodoro: {
            ...state.pomodoro,
            currentCycle: action.payload,
          },
          theme: {
            ...state.theme,
            primary: action.payload === 'pomodoro' ? '#f06b50' : (action.payload === 'shortBreak' ? '#0e4ead' : '#07093d'),
            textOnSecondary: action.payload === 'longBreak' ? '#107fc9' : '#121212',
          }
        };
      default:
        throw new Error(`Unrecognized action ${action.type}`);
    }
  }, INITIAL_STATE);

  // FIXME: Why isn't the timer being updated?
  useInterval(() => {
    dispatch({ type: 'tick' });
  }, state.clockStatus === 'running' ? 1000 : null);

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
  })()

  useEffect(() => {
    switch (state.clockStatus) {
      case 'running':
        document.title = `(${formattedSeconds}) ZenTomato`;
        break;
      case 'paused':
        document.title = `⏸(${formattedSeconds}) ZenTomato`
        break;
      case 'finished':
        document.title = `🏁✅ ZenTomato`
        break;
      default:
        document.title = originalTitle;
        break;
    }
  }, [formattedSeconds, state.clockStatus])

  useEffect(() => {
    (async () => {
      if (state.notifications.isRequestingAccess) {
        // TODO: Permission requesting should go into a thunk.
        const permission = await Notification.requestPermission()
        if (permission === 'denied') {
          alert('Notifications have been disabled for ZenTomato. You can re-enable them in your browser\'s settings.');
        }
        setNotificationsEnabled(permission === 'granted');
        return
      }
      if (state.notifications.enabled) {
        localStorage.setItem('notificationsEnabled', 'you betcha!');
      } else {
        localStorage.removeItem('notificationsEnabled');
      }
    })()
  }, [state.notifications.isRequestingAccess, state.notifications.enabled])

  useEffect(() => {
    if (state.clockStatus === 'finished' && state.notifications.enabled) {
      // TODO: Different notifications for different states.
      // TODO: Actions? See what you might want to do.
      const finishingPomodoro = state.pomodoro.currentCycle === 'pomodoro';
      const notification = new Notification(`Your ${finishingPomodoro ? 'pomodoro' : 'break'} is over 😌`, {
        icon: `${process.env.PUBLIC_URL}/logo192.png`,
        body: `${finishingPomodoro ? 'Take a short break' : 'Begin your next pomodoro'} when ready`,
      });
      const timer = setTimeout(() => notification.close(), 5000);
      notification.onclose = () => clearTimeout(timer);
    }
  }, [state.clockStatus, state.notifications.enabled, state.pomodoro.currentCycle]);

  const playPauseBtn = useRef();
  useEffect(() => {
    if (playPauseBtn.current) {
      playPauseBtn.current.focus();
    }
  }, [state.pomodoro.currentCycle]);

  useEffect(() => {
    let root = document.querySelector(':root');
    root.style.setProperty('--theme-primary', state.theme.primary);
    root.style.setProperty('--theme-secondary', state.theme.secondary);
    // Theme-text-on-primary is computed
    root.style.setProperty('--theme-text-on-secondary', state.theme.textOnSecondary);
  }, [state.theme]);

  const handlePlay = () => {
    dispatch({ type: 'play' });
    // Tick right away to let users know somethings happening
    dispatch({ type: 'tick' });
  };

  const handlePause = () => dispatch({ type: 'pause' });

  const handleStop = () => dispatch({ type: 'stop' });

  const requestNotificationAccess = () => dispatch({ type: 'requestNotificationAccess' });

  const setNotificationsEnabled = (enabled) => dispatch({ type: 'setNotificationsEnabled', payload: enabled });

  const handleNotifBellClick = () => {
    if (Notification.permission !== 'granted') {
      return requestNotificationAccess();
    }
    setNotificationsEnabled(!state.notifications.enabled);
  }

  const selectCycle = (cycle) => {
    dispatch({ type: 'selectCycle', payload: cycle });
    if (state.clockStatus === 'finished') {
      dispatch({ type: 'play' });
      dispatch({ type: 'tick' });
    }
  };

  const isRunning = state.clockStatus === 'running';

  const notificationBellStyle = theme => css`
    #bell {
      transition: fill 125ms ease;
      fill: ${state.notifications.enabled ? theme.textOnPrimary : 'none'};
    }
    margin-right: 8px;
  `;

  const currentCycle = state.pomodoro.currentCycle;

  return (
    <ThemeProvider theme={state.theme}>
      <div css={styles.appContainer}>
        <nav css={styles.topMenu}>
          {/* TODO: Hidden text in link */}
          <img css={css`margin-bottom: 20px; opacity: 0.7;`} src={logo} alt="Zen Tomato – A project by Travis Kaufman" width="96" height="96" />
          <button css={[styles.topMenuItem]}
            aria-label={`${state.notifications.enabled ? 'Disable' : 'Enable'} notifications`}
            onClick={handleNotifBellClick}
            hidden={!SUPPORTS_NOTIFS}>
            <NotificationBell css={notificationBellStyle} title={`${state.notifications.enabled ? 'Disable' : 'Enable'} notifications`} />
          </button>
        </nav>
        <main css={styles.appUI}>
          <section css={styles.segmentBar}>
            <button css={styles.segmentControl(currentCycle === 'pomodoro')} onClick={() => selectCycle('pomodoro')}>Pomodoro</button>
            <button css={styles.segmentControl(currentCycle === 'shortBreak')} onClick={() => selectCycle('shortBreak')}>Short break</button>
            <button css={styles.segmentControl(currentCycle === 'longBreak')} onClick={() => selectCycle('longBreak')}>Long break</button>
          </section>
          <time css={styles.time} dateTime={formattedSeconds}>{formattedSeconds}</time>
          <div css={styles.controls}>
            {/* TODO: Accessibility */}
            <button css={styles.control} onClick={isRunning ? handlePause : handlePlay} ref={playPauseBtn}>
              {isRunning ? <Pause /> : <Play />}
            </button>
            <button css={styles.control} disabled={state.clockStatus === 'stopped' || state.clockStatus === 'finished'} onClick={handleStop}><Stop /></button>
          </div>
        </main>
        <footer css={styles.footer}><p>A project by <a href="https://traviskaufman.io" target="_blank" rel="noopener noreferrer">Travis Kaufman</a></p></footer>
      </div>
    </ThemeProvider>
  );
}

export default App;
