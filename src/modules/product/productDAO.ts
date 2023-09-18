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
    const allProducts = await prisma.product.findMany();
    return allProducts;
  };

  getAll = async () => {
    const allProducts = await prisma.product.findMany({
      include: {
        design: true,
      },
    });
    return allProducts;
  };

  getById = async (id: number, variant: string) => {
    const allProducts = await prisma.product.findUnique({
      where: {
        id,
      },
      include: {
        design: {
          where: {
            variant,
          },
        },
      },
    });
    return allProducts;
  };
}

export default new ProductDAO();
