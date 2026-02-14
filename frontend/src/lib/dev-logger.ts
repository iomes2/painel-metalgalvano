/**
 * Development logging suppression
 * Removes noisy development-related console messages
 */

if (typeof window !== "undefined") {
  // Cache original console methods
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalInfo = console.info;

  // Patterns to suppress - specifically targeting Hot Refresh logs
  const suppressPatterns = [
    /\[Fast Refresh\]/,
    /hot-reloader-client/,
    /rebuilding/i,
    /done in \d+ms/i,
    /Download the React DevTools/i,
    /react-dom-client/i,
  ];

  const shouldSuppress = (message: string): boolean => {
    return suppressPatterns.some(pattern => pattern.test(message));
  };

  // Override console.log
  console.log = function (...args) {
    const message = args[0]?.toString?.() || "";
    
    // Suppress Fast Refresh and related logs
    if (!shouldSuppress(message)) {
      originalLog.apply(console, args);
    }
  };

  // Override console.warn
  console.warn = function (...args) {
    const message = args[0]?.toString?.() || "";
    
    if (!shouldSuppress(message)) {
      originalWarn.apply(console, args);
    }
  };

  // Override console.info
  console.info = function (...args) {
    const message = args[0]?.toString?.() || "";
    
    if (!shouldSuppress(message)) {
      originalInfo.apply(console, args);
    }
  };
}

export {};
