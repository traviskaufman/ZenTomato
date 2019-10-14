import { useEffect, useRef } from 'react';
import Timer from '../services/timer';

/** @see https://overreacted.io/making-setinterval-declarative-with-react-hooks/ */
export default function useStableInterval(callback, delay) {
  const stableTimer = useRef();
  const savedCallback = useRef();

  // Initialize the stable timer only once, and save the result
  useEffect(() => {
    stableTimer.current = new Timer();
    return () => stableTimer.current.destroy();
  }, []);

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = stableTimer.current.setInterval(tick, delay);
      return () => {
        stableTimer.current.clearInterval(id);
      }
    }
  }, [delay]);
}
