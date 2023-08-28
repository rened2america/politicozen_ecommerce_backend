import { Artist } from "@prisma/client";
import { prisma } from "../../database/initialConfig";

class ArtistDAO {
  getArtistByEmail = async (email: string): Promise<Artist | null> => {
    const artist: Artist | null = await prisma.artist.findUnique({
      where: {
        email,
      },
    });

    return artist;
  };
}

export default new ArtistDAO();
