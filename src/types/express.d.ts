import { Document } from 'mongoose';
import { IUser } from '../models/User.model';
import { IStore } from '../models/Store.model';

declare global {
  namespace Express {
    interface Request {
      user?: IUser & Document;
      storeId?: string;
      store?: IStore & Document;
    }
  }
}

