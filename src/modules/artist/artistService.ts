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
    return password === passwordFromDb;
  };
}

export default new ArtistService();
