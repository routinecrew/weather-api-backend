import express from 'express';
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
        imgSrc: ["'self'", 'data:', 'blob:', "'localhost:*'"],
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
app.use((_req, res) => {
  res.status(200).send('<h1>Express + Typescript Server</h1>');
});

app.use(errorConverter);
app.use(errorHandler);

export default app;
