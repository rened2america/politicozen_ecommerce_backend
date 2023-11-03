import { prisma } from "../../database/initialConfig";

class ProductDAO {
  create = async (data: any) => {
    try {
      const newProduct = await prisma.product.create({
        data,
      });
      return newProduct;
    } catch (error) {
      console.log("localError", error);
      return error;
    }
  };

  getByUser = async (artistId: number) => {
    console.log(artistId);
    const allProducts = await prisma.product.findMany({
      where: {
        artistId,
      },
    });
    return allProducts;
  };

  getAll = async (filters: any, page: any) => {
    console.log(page);
    const [allProducts, count] = await prisma.$transaction([
      prisma.product.findMany({
        skip: (page.page - 1) * page.limit,
        take: page.limit,
        where: {
          AND: filters,
          // AND: {
          //   artist: {
          //     OR: [
          //       {
          //         name: "Rene Alberto Meza Escamilla",
          //       },
          //       {
          //         name: "Rene Meza",
          //       },
          //     ],
          //   },
          // },
        },
        include: {
          design: true,
          tag: true,
          types: true,
          artist: true,
        },
      }),
      prisma.product.count({
        where: {
          AND: filters,
        },
      }),
    ]);
    console.log(count);
    return { products: allProducts, count: count };
  };

  getById = async (id: number, variant: string, size: string) => {
    console.log("getById", id);
    const allProducts = await prisma.product.findUnique({
      where: {
        id,
      },
      include: {
        design: true,
        sizes: true,
        colors: true,
        tag: true,
      },
    });
    console.log("allProducts", allProducts);
    return allProducts;
  };
}

export default new ProductDAO();
