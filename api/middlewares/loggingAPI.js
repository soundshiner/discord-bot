// api/middlewares/loggingAPI.js
import logger from '../../bot/logger.js';

export default function loggingAPI () {
  return (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const status = res.statusCode;
      const { method } = req;
      const { url } = req;
      const ip = req.ip || req.connection.remoteAddress;

      if (global.metricsCollector) {
        global.metricsCollector.recordApiRequest(method, url, status, duration);
      }

      const log = `${method} ${url} - ${status} - ${duration}ms - ${ip}`;
      // eslint-disable-next-line no-unused-expressions
      status >= 400 ? logger.warn(log) : logger.info(log);
    });
    next();
  };
}
// This middleware logs API requests, including method, URL, status code, duration, and IP address.
// It also integrates with a global metrics collector if available, recording the request metrics.

