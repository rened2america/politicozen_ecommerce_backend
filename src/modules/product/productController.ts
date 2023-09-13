import { Request, Response } from "express";
import { withErrorHandlingDecorator } from "../../decorators/withErrorHandlingDecorator";
import productService from "./productService";
import Stripe from "stripe";
//import { decode } from "base64-arraybuffer"; borrar
// import { Upload } from "@aws-sdk/lib-storage"; borrar
// import { S3Client } from "@aws-sdk/client-s3"; borrar
import AWS from "aws-sdk";

const create = async (req: Request, res: Response) => {
  const accessKeyId = "AKIA5V3WMRCAFULV2ZLM";
  const secretAccessKey = "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";
  const region = "us-east-2";
  const Bucket = "politicozen-test";

  AWS.config.update({
    accessKeyId,
    secretAccessKey,
    region,
  });

  // Crea un nuevo objeto de servicio S3
  const s3 = new AWS.S3();

  const imgLogo = Buffer.from(req.body.imgLogo, "base64");
  const imgProduct = Buffer.from(req.body.imgProduct.split(",")[1], "base64");
  const productName = req.body.name;
  const paramsImgLogo = {
    Bucket,
    Key: `${Date.now().toString()}-${productName}-logo`,
    Body: imgLogo,
    ContentType: "image/png", // Cambia esto según el tipo de imagen
  };

  const paramsImgProduct = {
    Bucket,
    Key: `${Date.now().toString()}-${productName}-product`,
    Body: imgProduct,
    ContentType: "image/png", // Cambia esto según el tipo de imagen
  };
  const imgLogoURL = await s3.upload(paramsImgLogo).promise();
  const imgProductURL = await s3.upload(paramsImgProduct).promise();

  const stripe = new Stripe(
    "sk_test_51HFtCKDsqhqgulRL3PU0mFSWSEZiCeJQCHhSldDZJKl77sKFAXUrUyfpegHjjV3jFNoiVK6qAIW0T3J2rbILKbJ5008zvuTfYN",
    {
      apiVersion: "2023-08-16",
    }
  );

  const product = await stripe.products.create({
    name: "Tshirt",
    images: [imgLogoURL.Location, imgProductURL.Location],
  });

  const price = await stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: 30,
  });

  // console.log(req.user);
  // console.log(req.body.imgLogo);
  // console.log(req.body.imgProduct);
  // console.log(req.body.name);
  const artistId = 6;
  // validar si el titulo del producto existe si no existe crear el producto
  const reqNewProduct = {
    price: price.unit_amount,
    title: product.name,
    subtitle: "prueba subtitulo",
    artistId: artistId,
  };
  const newProduct = await productService.create(reqNewProduct);

  res
    .status(201)
    .json({ message: "Producto Creado", newProduct, price, product });
};

const getByUser = async (_: Request, res: Response) => {
  const products = await productService.getByUser(1);
  res.status(201).json({ message: "Producto Creado", products });
};

const getAll = async (_: Request, res: Response) => {
  const products = await productService.getAll();
  res.status(201).json({ message: "Productos Obtenidos", products });
};

const getById = async (req: Request, res: Response) => {
  const productId: number = parseInt(req.params.id);
  const products = await productService.getById(productId);
  res.status(201).json({ message: "Productos Obtenidos", products });
};

const createWithDecorators = withErrorHandlingDecorator(create);
const getAllWithDecorators = withErrorHandlingDecorator(getAll);
const getByUserWithDecorators = withErrorHandlingDecorator(getByUser);
const getByIdWithDecorators = withErrorHandlingDecorator(getById);

export const productController = {
  create: createWithDecorators,
  getAll: getAllWithDecorators,
  getByUser: getByUserWithDecorators,
  getById: getByIdWithDecorators,
};
