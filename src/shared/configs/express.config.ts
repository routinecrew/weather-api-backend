import express, { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import requestTracer from 'cls-rtracer';
import morganLogger from './morgan.config';
import passport from 'passport';
import apiRouter from '../../service-init/routes';
import { resourcePath } from '../utils';
import { errorConverter, errorHandler } from '../middlewares';

const app = express();

app.use(compression());
app.use(cors({ origin: '*', credentials: true, optionsSuccessStatus: 200 }));
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'http://localhost:*', 'https://localhost:*'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'"],
        scriptSrc: ["'self'"],
      },
    },
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestTracer.expressMiddleware());
app.use(morganLogger);
app.use(passport.initialize());

app.use('/', apiRouter);
app.use('/resources', express.static(resourcePath));

app.use((req: Request, res: Response, _next: NextFunction) => { // 'next' → '_next'
  res.status(404).json({
    result: false,
    message: `Route not found: ${req.method} ${req.path}`,
  });
});

app.use(errorConverter);
app.use(errorHandler);

const PORT = process.env.PORT || 9092;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;