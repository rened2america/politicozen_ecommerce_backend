import { User } from "../custom";

export type User = {
  artistId: number;
};

// to make the file a module and avoid the TypeScript error
export {};

declare global {
  namespace Express {
    export interface Request {
      user?: User;
    }
  }
}
