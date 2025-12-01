declare module 'express-status-monitor' {
  import { RequestHandler } from 'express';

  interface StatusMonitorOptions {
    title?: string;
    theme?: string;
    path?: string;
    socketPath?: string;
    websocket?: any;
    spans?: any[];
    chartVisibility?: {
      cpu?: boolean;
      mem?: boolean;
      load?: boolean;
      responseTime?: boolean;
      rps?: boolean;
      statusCodes?: boolean;
    };
    healthChecks?: any[];
    ignoreStartsWith?: string;
  }

  function statusMonitor(options?: StatusMonitorOptions): RequestHandler;

  export = statusMonitor;
}
