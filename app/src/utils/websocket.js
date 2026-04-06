// Safe WebSocket wrapper for React Native
// Fixes "cannot assign to property protocol" error

export function createWebSocket(url) {
  try {
    // In React Native, WebSocket is a native implementation
    // We need to create it without any protocol parameter
    const ws = new WebSocket(url);
    
    // Don't try to modify protocol or any read-only properties
    return ws;
  } catch (error) {
    console.error('Failed to create WebSocket:', error);
    throw error;
  }
}

// Alternative: Create with explicit null protocol
export function createWebSocketSafe(url) {
  try {
    // Some implementations require explicit protocol parameter
    // Pass null or undefined to avoid protocol issues
    const ws = new WebSocket(url, null);
    return ws;
  } catch (error) {
    // Fallback to simple constructor
    console.warn('WebSocket with protocol failed, trying without:', error);
    return new WebSocket(url);
  }
}
