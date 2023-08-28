import productDAO from "./productDAO";

class ProductService {
  create = async (artistId: number) => {
    const newProduct = await productDAO.create(artistId);
    return newProduct;
  };
}

export default new ProductService();
