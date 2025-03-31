import { UserAttributes } from '../../service-init/models/main/user.model';

declare global {
  namespace Express {
    interface User extends UserAttributes {
      id: number;
      createdAt: Date;
      updatedAt: Date;
      deletedAt?: Date;
    }

    interface Request {
      user: User;
    }
  }
}

declare module 'express-serve-static-core' {
  interface ParamsDictionary {
    id: number;
    [key: string]: string;
  }
}
