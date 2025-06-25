// api/middlewares/helmet.js
import helmet from 'helmet';

export default helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
});
