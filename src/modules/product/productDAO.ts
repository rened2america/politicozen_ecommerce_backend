import { prisma } from "../../database/initialConfig";

class ProductDAO {
  create = async (artistId: number) => {
    const newProduct = await prisma.product.create({
      data: {
        price: 10,
        title: "Prueba de titulo2",
        subtitle: "prueba subtitulo",
        artistId: artistId,
      },
    });
    return newProduct;
  };

  getAll = async (artistId: number) => {
    console.log(artistId);
    const allProducts = await prisma.product.findMany();
    return allProducts;
  };
}

export default new ProductDAO();
