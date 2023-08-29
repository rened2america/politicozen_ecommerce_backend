import { Request, Response } from "express";
import { withErrorHandlingDecorator } from "../../decorators/withErrorHandlingDecorator";
import productService from "./productService";

const create = async (req: Request, res: Response) => {
  console.log(req.user);
  const artistId = req.user.artistId;
  // validar si el titulo del producto existe si no existe crear el producto
  const product = await productService.create(artistId);

  res.status(201).json({ message: "Producto Creado", product });
};

const createWithDecorators = withErrorHandlingDecorator(create);

export const productController = {
  create: createWithDecorators,
};
