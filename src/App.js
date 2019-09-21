/** @jsx jsx */
import { useReducer, useEffect } from 'react';
import useInterval from 'use-interval';
import { css, jsx } from '@emotion/core';
import { ThemeProvider } from 'emotion-theming';
// TODO: Icon fonts?
import logo from './logo.svg';
import { ReactComponent as NotificationBell } from './notificationBell.svg';
import { ReactComponent as Play } from './Play.svg';
import { ReactComponent as Pause } from './Pause.svg';
import { ReactComponent as Stop } from './Stop.svg';

const theme = {
  primary: '#f06b50',
  secondary: '#fff',
  textOnPrimary: '#fff',
  textOnSecondary: '#121212',
}

const cssHelpers = {
  btnReset: css`
    background: none;
    border: none;
    appearance: none;
    outline: none;
    cursor: pointer;
  `,
};

const styles = {
  topMenu: css`
    position: fixed;
    top: 20px;
    left: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  `,
  topMenuItem: css`
    ${cssHelpers.btnReset};
    outline: none;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 125ms ease;
    &:hover {
      opacity: 1;
    }

    margin-bottom: 20px;
    &:last-child {
      margin-bottom: 0;
    }
  `,
  time: css`
    /* TODO: Make this larger and scale with the size of the screen */
    font-size: 12rem;
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
    ${cssHelpers.btnReset}
    transition: transform 125ms ease;
    opacity: 1;
    cursor: pointer;
    margin-right: 24px;
    &:last-child {
      margin-right: 0;
    }
    &:hover {
      transform: scale(1.08);
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
  `,
  segmentControl: theme => css`
    ${cssHelpers.btnReset}
    text-align: center;
    background-color: rgba(255, 255, 255, 0);
    color: ${theme.textOnPrimary};
    border-right: 1px solid ${theme.textOnPrimary};
    display: block;
    width: 100%;
    height: 100%;
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
    letter-spacing: 0.5;
    transition: color 125ms ease, background-color 125ms ease;

    &:first-child {
      border-top-left-radius: inherit;
      border-bottom-left-radius: inherit;
    }

    &:last-child {
      border-right: none;
      border-bottom-right-radius: inherit;
      border-top-right-radius: inherit;
    }

    &:hover {
      background-color: rgba(255, 255, 255, 0.4);
    }
  `,
  footer: theme => css`
    font-size: 0.75rem;
    opacity: 0.7;
    text-align: center;
    position: absolute;
    left: 0;
    right: 0;
    bottom: 20px;

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
  secondsRemaining: 25 * 60,
  clockStatus: 'stopped',
  notifications: {
    isRequestingAccess: false,
    // TODO: Refactor into storage, find a way to know if someone disables permissions in settings.
    enabled: Boolean(localStorage.getItem('notificationsEnabled')),
  }
}
function App() {
  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      // For now these are the same, but semantically they are different,
      // so I will separate them.
      case 'play':
        return {
          ...state,
          // It's better UX to auto-tick right away. Let's the user know something happened immediately.
          secondsRemaining: state.secondsRemaining - 1,
          clockStatus: 'running',
        };
      case 'tick':
        let newSecondsRemaining = state.secondsRemaining - 1;
        const isFinished = newSecondsRemaining === 0;
        return {
          ...state,
          secondsRemaining: isFinished ? INITIAL_STATE.secondsRemaining : newSecondsRemaining,
          clockStatus: isFinished ? 'finished' : state.clockStatus,
        };
      case 'pause':
        return {
          ...state,
          clockStatus: 'paused'
        };
      case 'stop':
        if (state.clockStatus === 'finished') return state;
        return {
          ...state,
          secondsRemaining: INITIAL_STATE.secondsRemaining,
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
      default:
        throw new Error(`Unrecognized action ${action.type}`);
    }
  }, INITIAL_STATE);

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

  // TODO: Permission requesting should go into a thunk.

  const handlePlay = () => dispatch({ type: 'play' });

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

  const isRunning = state.clockStatus === 'running';

  const notificationBellStyle = theme => css`
    #bell {
      transition: fill 125ms ease;
      fill: ${state.notifications.enabled ? theme.textOnPrimary : 'none'};
    }
    margin-right: 8px;
  `;

  return (
    <ThemeProvider theme={theme}>
      <div css={styles.appContainer}>
        <nav css={styles.topMenu}>
          {/* TODO: Hidden text in link */}
          <button css={[styles.logo, styles.topMenuItem]} href="#menu" title="menu"><img src={logo} alt="ZenTomato" width="96" height="96" /></button>
          <button css={[styles.topMenuItem]}
            aria-label={`${state.notifications.enabled ? 'Disable' : 'Enable'} notifications`}
            onClick={handleNotifBellClick}>
            <NotificationBell css={notificationBellStyle} title={`${state.notifications.enabled ? 'Disable' : 'Enable'} notifications`} />
          </button>
        </nav>
        <main css={styles.appUI}>
          <section css={styles.segmentBar}>
            <button css={styles.segmentControl} title="cmd+p" onClick={() => console.debug('pomodoro')}>Pomodoro</button>
            <button css={styles.segmentControl} title="cmd+b" onClick={() => console.debug('shortBreak')}>Short break</button>
            <button css={styles.segmentControl} title="cmd+shift+b" onClick={() => console.debug('longBreak')}>Long break</button>
          </section>
          <time css={styles.time} dateTime={formattedSeconds}>{formattedSeconds}</time>
          <div css={styles.controls}>
            {/* TODO: Accessibility */}
            <button css={styles.control} title="spacebar" onClick={isRunning ? handlePause : handlePlay}>{isRunning ? <Pause /> : <Play />}</button>
            <button css={styles.control} title="cmd+." onClick={handleStop}><Stop /></button>
          </div>
        </main>
        <footer css={styles.footer}><p>A project by <a href="https://traviskaufman.io" target="_blank" rel="noopener noreferrer">Travis Kaufman</a></p></footer>
      </div>
    </ThemeProvider>
  );
}

export default App;
