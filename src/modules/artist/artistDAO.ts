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

  getArtistById = async (id: number): Promise<Artist | null> => {
    const artist: Artist | null = await prisma.artist.findUnique({
      where: {
        id,
      },
    });

    return artist;
  };
  updateArtist = async (id: number, data: any): Promise<Artist | null> => {
    const artist: Artist | null = await prisma.artist.update({
      where: {
        id,
      },
      data,
    });
    return artist;
  };
  getAll = async (
    page: number,
    limit: number
  ): Promise<{ artists: Artist[]; count: number } | null> => {
    console.log(page);
    const [artists, count] = await prisma.$transaction([
      prisma.artist.findMany({
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.artist.count(),
    ]);

    return {
      artists: artists,
      count: count,
    };
  };

  getProfileAndProducts = async (id: number, page: number, limit: number) => {
    console.log(id);
    const [products, count, profile] = await prisma.$transaction([
      prisma.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: {
          artistId: id,
        },
        include: {
          design: true,
        },
      }),
      prisma.product.count(),
      prisma.artist.findUnique({
        where: {
          id,
        },
      }),
    ]);

    return {
      products,
      count,
      profile,
    };
  };
}

export default new ArtistDAO();
