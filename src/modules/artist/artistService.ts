import bcrypt from "bcrypt";
import { Artist } from "@prisma/client";
import artistDAO from "./artistDAO";

class ArtistService {
  getArtistByEmail = async (email: string): Promise<Artist | null> => {
    const artistExist: Artist | null = await artistDAO.getArtistByEmail(email);
    return artistExist;
  };

  artistPasswordIsValid = async (
    password: string,
    passwordFromDb: string
  ): Promise<boolean> => {
    const isValidPassword = await bcrypt.compare(password, passwordFromDb);
    return isValidPassword;
  };
}

export default new ArtistService();
