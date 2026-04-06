// WebSocket polyfill to fix "protocol" property error in React Native
// This prevents libraries from trying to modify read-only properties

if (typeof global !== 'undefined' && global.WebSocket) {
  const OriginalWebSocket = global.WebSocket;
  
  // Create a proxy to intercept WebSocket creation
  global.WebSocket = new Proxy(OriginalWebSocket, {
    construct(target, args) {
      const [url, protocols] = args;
      
      // Create WebSocket instance
      const ws = protocols !== undefined 
        ? new target(url, protocols) 
        : new target(url);
      
      // Wrap the instance to protect read-only properties
      return new Proxy(ws, {
        set(obj, prop, value) {
          // Ignore attempts to set read-only properties
          if (prop === 'protocol' || prop === 'url' || prop === 'readyState') {
            console.warn(`Ignoring attempt to set read-only WebSocket.${prop}`);
            return true;
          }
          obj[prop] = value;
          return true;
        },
        get(obj, prop) {
          const value = obj[prop];
          // Bind methods to the original object
          if (typeof value === 'function') {
            return value.bind(obj);
          }
          return value;
        }
      });
    }
  });
  
  // Copy static properties
  global.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
  global.WebSocket.OPEN = OriginalWebSocket.OPEN;
  global.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
  global.WebSocket.CLOSED = OriginalWebSocket.CLOSED;
}
