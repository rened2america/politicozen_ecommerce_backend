import productDAO from "./productDAO";

class ProductService {
  create = async (product: any) => {
    const newProduct = await productDAO.create(product);
    return newProduct;
  };
  getByUser = async (artistId: number) => {
    const getProducts = await productDAO.getByUser(artistId);
    return getProducts;
  };
  getAll = async () => {
    const getProducts = await productDAO.getAll();
    return getProducts;
  };
  getById = async (id: number) => {
    const getProducts = await productDAO.getById(id);
    return getProducts;
  };
}

export default new ProductService();
