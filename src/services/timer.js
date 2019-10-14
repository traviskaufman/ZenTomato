/**
 * Inspired by https://github.com/turuslan/HackTimer, this uses a worker to execute timer methods so that timers
 * run reliably within a background thread.
 */

const WORKER_SCRIPT = `
  const idMap = {};

  onmessage = (evt) => {
    switch (evt.data.command) {
    case 'setInterval':
      idMap[evt.data.id] = setInterval(() => postMessage({event: 'tick', id: evt.data.id}), evt.data.interval || 0);
      break;
    case 'clearInterval':
      clearInterval(idMap[evt.data.id]);
      break;
    default:
      break;
    }
  };
`;

export default class Timer {
  constructor() {
    let workerScriptPayload = new Blob([WORKER_SCRIPT]);
    let workerUrl = URL.createObjectURL(workerScriptPayload);
    this._idFnMap = {};
    this._currentId = 0;
    this._worker = new Worker(workerUrl);
    this._worker.onmessage = (evt) => {
      switch (evt.data.event) {
        case 'tick':
          const fn = this._idFnMap[evt.data.id];
          if (fn) {
            fn();
          }
          break;
        default:
          break;
      }
    }
  }

  destroy() {
    this._worker.terminate();
  }

  setInterval(fn, interval) {
    const id = ++this.currentId;
    this._idFnMap[id] = fn;
    this._worker.postMessage({ command: 'setInterval', id, interval });
    return id;
  }

  clearInterval(id) {
    this._worker.postMessage({ command: 'clearInterval', id });
    delete this._idFnMap[id];
  }
}
