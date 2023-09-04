import productDAO from "./productDAO";

class ProductService {
  create = async (artistId: number) => {
    const newProduct = await productDAO.create(artistId);
    return newProduct;
  };

  getAll = async (artistId: number) => {
    const getProducts = await productDAO.getAll(artistId);
    return getProducts;
  };
}

export default new ProductService();
