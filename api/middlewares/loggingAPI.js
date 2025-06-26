// api/middlewares/loggingAPI.js
import logger from '../../utils/logger.js';

export default function loggingAPI() {
  return (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const status = res.statusCode;
      const method = req.method;
      const url = req.url;
      const ip = req.ip || req.connection.remoteAddress;

      if (global.metricsCollector) {
        global.metricsCollector.recordApiRequest(method, url, status, duration);
      }

      const log = `${method} ${url} - ${status} - ${duration}ms - ${ip}`;
      status >= 400 ? logger.warn(log) : logger.info(log);
    });
    next();
  };
}
// This middleware logs API requests, including method, URL, status code, duration, and IP address.
// It also integrates with a global metrics collector if available, recording the request metrics.  