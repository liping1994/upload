global.XMLHttpRequest = values => new Proxy(mock(values), handler);

const handler = {
  get: (target, name) => {
    if (target[name]) return target[name];
  },
};

let callbacks = [];
global.headers = [];
let blockSend;
const mock = values => ({
  status: 200,
  response: JSON.stringify({ finished: 'hell yes' }),
  addEventListener: (name, callback) => {
    callbacks.push({ name, callback });
  },
  upload: {
    addEventListener: (name, callback) => {
      callbacks.push({ name, callback });
    },
  },
  getHeaders: () => headers,
  setRequestHeader: (name, value) => headers.push({ name, value }),
  open: (method, url) => {
    blockSend = false;
    headers = [];
    if (url === 'http://fail.dev') {
      callbacks.find(({ name }) => name === 'error').callback(true);
      blockSend = true;
      callbacks = [];
    } else if (url === 'http://abort.dev') {
      callbacks.find(({ name }) => name === 'abort').callback(true);
      blockSend = true;
      callbacks = [];
    }
  },
  send: () => {
    if (blockSend) return;
    let progress = callbacks.find(({ name }) => name === 'progress').callback;
    let load = callbacks.find(({ name }) => name === 'load').callback;
    callbacks = [];
    progress({ loaded: 0.1, total: 1 });
    setTimeout(() => progress({ loaded: 0.5, total: 1 }), 100);
    setTimeout(() => load(JSON.stringify({ finished: 'hell yes' })), 200);
  },
  ...values,
});
