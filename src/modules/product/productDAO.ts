import { prisma } from "../../database/initialConfig";

class ProductDAO {
  create = async (data: any) => {
    const newProduct = await prisma.product.create({
      data,
    });
    return newProduct;
  };

  getByUser = async (artistId: number) => {
    console.log(artistId);
    const allProducts = await prisma.product.findMany();
    return allProducts;
  };

  getAll = async () => {
    const allProducts = await prisma.product.findMany();
    return allProducts;
  };

  getById = async (id: number) => {
    const allProducts = await prisma.product.findUnique({
      where: {
        id,
      },
    });
    return allProducts;
  };
}

export default new ProductDAO();
