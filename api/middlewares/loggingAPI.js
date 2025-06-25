// api/middlewares/loggingAPI.js
export default function loggingAPI(logger) {
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
  