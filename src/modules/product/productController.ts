import { Request, Response } from "express";
import { withErrorHandlingDecorator } from "../../decorators/withErrorHandlingDecorator";
import productService from "./productService";
//import { decode } from "base64-arraybuffer"; borrar
// import { Upload } from "@aws-sdk/lib-storage"; borrar
// import { S3Client } from "@aws-sdk/client-s3"; borrar
import { prisma } from "../../database/initialConfig";
import { isJson } from "../../utils/isJson";
import { connectionStripe } from "../../utils/configStripe";
import { connectionAws } from "../../utils/configAws";
import { round } from "mathjs";
import { generateCode } from "../../utils/generateCode";
const create = async (req: Request, res: Response) => {
  const { x, y, angle, scale, tags, type } = req.body;
  const xDecimal = round(x, 6);
  const yDecimal = round(y, 6);
  const angleDecimal = round(angle, 6);
  const scaleDecimal = round(scale, 6);

  const productName = req.body.name;
  const productSubtitle = req.body.subtitle;
  const productDescription = req.body.description;

  const s3 = connectionAws();
  const stripe = connectionStripe();

  const logoURL = await productService.uploadLogo(
    req.body.imgLogo,
    s3,
    productName
  );
  const imagesBuffer = await productService.transformImagesFromBase64ToBuffer(
    req.body.imgListProduct
  );
  const ImagesUrl = await productService.uploadImages(
    imagesBuffer,
    productName,
    s3
  );
  const productStripe = await productService.createProductInStripe(
    ImagesUrl,
    stripe,
    productName
  );

  const tagOperations = tags.map((tagValue) => ({
    where: { value: tagValue },
    create: { value: tagValue },
  }));

  // const imgListProducts = req.body.imgListProduct.map((imgProduct: any) => {
  //   return Buffer.from(imgProduct.split(",")[1], "base64");
  // });
  // const imgProduct = Buffer.from(req.body.imgProduct.split(",")[1], "base64");

  const artistId = req.user.artistId;
  // // validar si el titulo del producto existe si no existe crear el producto
  const newProduct = await productService.create({
    price: 30,
    title: productName,
    subtitle: productSubtitle,
    description: productDescription,
    artistId: artistId,
    idGeneral: generateCode(),
    tag: {
      connectOrCreate: tagOperations,
    },
    types: {
      connectOrCreate: [
        {
          where: { value: type },
          create: { value: type },
        },
      ],
    },
    sizes: {
      connectOrCreate: [
        {
          where: { value: "S" },
          create: { value: "S" },
        },
        {
          where: { value: "M" },
          create: { value: "M" },
        },
        {
          where: { value: "L" },
          create: { value: "L" },
        },
      ],
    },
    colors: {
      connectOrCreate: [
        {
          where: { value: "White" },
          create: { value: "White" },
        },
        {
          where: { value: "Beige" },
          create: { value: "Beige" },
        },
        {
          where: { value: "Red" },
          create: { value: "Red" },
        },
        {
          where: { value: "Blue" },
          create: { value: "Blue" },
        },
        {
          where: { value: "Black" },
          create: { value: "Black" },
        },
      ],
    },
  });
  const productsToDb = productStripe.flat().map((product) => {
    return {
      //@ts-ignore
      productId: newProduct.id,
      positionX: xDecimal,
      positionY: yDecimal,
      angle: angleDecimal,
      scale: scaleDecimal,
      variant: product.color,
      price: 30,
      priceId: product.id,
      url: product.imgProductURL,
      urlLogo: logoURL,
      artistId: artistId,
      size: product.size,
    };
  });
  const createManyDesign = await prisma.design.createMany({
    //@ts-ignore
    data: productsToDb,
    skipDuplicates: true,
  });
  res.status(201).json({
    message: "Producto Creado",
    products: createManyDesign ? createManyDesign : [],
  });
};

const getByUser = async (req: Request, res: Response) => {
  const artistId = req.user.artistId;
  const products = await productService.getByUser(artistId);
  res.status(201).json({ message: "Producto Creado", products: products });
};

const getAll = async (req: Request, res: Response) => {
  // const sortBy = req.query.sortBy || "desc";
  const search = req.query.search || "";
  const filter = req.query.filters || "";
  //@ts-ignore
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const limit = 12;
  //@ts-ignore
  if (isJson(filter)) {
    //@ts-ignore

    const filterParse = JSON.parse(filter);
    const filterEntries: any = Object.entries(filterParse);

    const arrayFilter = filterEntries.map((entry: any) => {
      const newFilter = {};

      if (entry[0] === "artist") {
        //@ts-ignore
        newFilter[entry[0]] = {
          OR: entry[1],
        };
        return newFilter;
      } else {
        newFilter[entry[0]] = {
          some: {
            value: {
              in: entry[1],
            },
          },
        };
      }
      //@ts-ignore

      return newFilter;
    });
    arrayFilter.push({
      title: {
        contains: search,
      },
    });
    console.log(arrayFilter);
    const products = await productService.getAll(arrayFilter, { page, limit });
    res.status(201).json({
      message: "Productos Obtenidos",
      products: products.products,
      count: products.count,
    });
    return;
  } else {
    const arrayFilter = [
      {
        title: {
          contains: search,
        },
      },
    ];
    const products = await productService.getAll(arrayFilter, {
      page,
      limit,
    });
    res.status(201).json({
      message: "Productos Obtenidos",
      products: products.products,
      count: products.count,
    });
  }
};

const getById = async (req: Request, res: Response) => {
  const productId: number = parseInt(req.params.id);
  //@ts-ignore
  const variant: string = req.query.variant ? req.query.variant : "white";
  //@ts-ignore
  const size = req.query.size ? req.query.size : "S";
  //@ts-ignore
  const products = await productService.getById(productId, variant, size);
  res.status(201).json({ message: "Productos Obtenidos", products });
};

const session = async (req: Request, res: Response) => {
  const NormalizeProducts = req.body.products.map((product: any) => {
    return {
      price: product.priceId,
      quantity: product.count,
    };
  });
  const stripe = connectionStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: NormalizeProducts,
    success_url: "https://politicozen.dev/succes/",
    cancel_url: "https://politicozen.dev/cancel/",
  });

  res
    .status(201)
    .json({ message: "Session obtenida", session: session ? session : {} });
};

const webhook = async (req: Request, res: Response) => {
  const stripe = connectionStripe();
  if (req.body.type === "checkout.session.completed") {
    const user = req.body.data.object.customer_details;
    const listData = await stripe.checkout.sessions.listLineItems(
      req.body.data.object.id
    );
    const listPromise = listData.data.map(async (product) => {
      const design = await prisma.design.findFirst({
        where: {
          //@ts-ignore
          priceId: product.price.id,
        },
      });
      //@ts-ignore
      await prisma.order.create({
        data: {
          city: user.address.city ? user.address.city : "",
          country: user.address.country ? user.address.country : "",
          line1: user.address.line1 ? user.address.line1 : "",
          line2: user.address.line2 ? user.address.line2 : "",
          postalCode: user.address.postal_code ? user.address.postal_code : "",
          state: user.address.state ? user.address.state : "",
          email: user.email ? user.email : "",
          name: user.name ? user.name : "",
          phone: user.phone ? user.phone : "",
          amount: product.amount_total.toString(),
          //@ts-ignore
          quantity: product.quantity,
          //@ts-ignore
          priceId: product.price.id,
          productName: product.description,
          //@ts-ignore
          artistId: design?.artistId,
        },
      });
    });

    await Promise.all(listPromise);
  }
  res.sendStatus(200);
};

const getOrders = async (req: Request, res: Response) => {
  const artistId = req.user.artistId;
  const today = new Date();
  const firstDayOfCurrentMonth = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );
  const firstDayOfLastMonth = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );
  const lastDayOfLastMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  );
  // const ordersCount = await prisma.order.count({
  //   where: {
  //     artistId,
  //   },
  // });
  // const orders = await prisma.order.findMany({
  //   where: {
  //     artistId,
  //   },
  // });

  const ordersCount = await prisma.order.count({
    where: {
      artistId,
      createdAt: {
        gte: firstDayOfLastMonth,
        lte: lastDayOfLastMonth,
      },
    },
  });

  const orders = await prisma.order.findMany({
    where: {
      artistId,
      createdAt: {
        gte: firstDayOfLastMonth,
        lte: lastDayOfLastMonth,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const totalAmount = orders.reduce(
    (sum, order) => sum + parseInt(order.amount),
    0
  );
  let normalizeOrders = [];
  const daysOfMonth = lastDayOfLastMonth.getDate();
  console.log(daysOfMonth);

  for (let i = 1; i <= daysOfMonth; i++) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const findDate = orders.filter((order) => {
      return new Date(order.createdAt).getDate() === i;
    });
    if (findDate.length > 0) {
      normalizeOrders.push({
        time: `${year}-${month}-${String(i).padStart(2, "0")}`,
        value: findDate.length,
      });
    } else {
      normalizeOrders.push({
        time: `${year}-${month}-${String(i).padStart(2, "0")}`,
        value: 0,
      });
    }
  }

  res.status(201).json({
    amount: totalAmount,
    countSales: ordersCount,
    orders,
    normalizeOrders,
  });
};

const update = async (req: Request, res: Response) => {
  const productFromUser = req.body;
  const artistId = req.user.artistId;

  console.log("productFromUser:", productFromUser);
  const product = await prisma.product.findUnique({
    where: {
      id: productFromUser.id,
      artistId,
    },
    include: {
      tag: true, // Esto incluye las etiquetas actuales del producto en la respuesta.
    },
  });
  const tagOperations = productFromUser.tags.map((tagValue) => ({
    where: { value: tagValue },
    create: { value: tagValue },
  }));
  const updatedProduct = await prisma.product.update({
    where: {
      id: productFromUser.id,
    },
    data: {
      title: productFromUser.title,
      description: productFromUser.description,
      tag: {
        disconnect: product.tag.map((tag) => ({ id: tag.id })),
        connectOrCreate: tagOperations,
      },
    },
    include: {
      tag: true,
    },
  });

  console.log("product update", updatedProduct);
  res.status(201).json({
    message: "Product Updated",
  });
};

const deleteProduct = async (req: Request, res: Response) => {
  console.log("aqui estoy");
  const productId = req.params.productId
    ? parseInt(req.params.productId)
    : null;
  console.log("hola", req.user);
  const artistId = req.user.artistId;

  console.log("artist", artistId);
  console.log("productId", productId);

  if (productId) {
    await prisma.product.delete({
      where: {
        id: productId,
        artistId,
      },
    });
  }
  res.status(201).json({
    message: "Product delete",
  });
};

const createWithDecorators = withErrorHandlingDecorator(create);
const getAllWithDecorators = withErrorHandlingDecorator(getAll);
const getByUserWithDecorators = withErrorHandlingDecorator(getByUser);
const getByIdWithDecorators = withErrorHandlingDecorator(getById);
const sessionWithDecorators = withErrorHandlingDecorator(session);
const webhookWithDecorators = withErrorHandlingDecorator(webhook);
const getOrdersWithDecorators = withErrorHandlingDecorator(getOrders);
const updateWithDecorators = withErrorHandlingDecorator(update);
const deleteWithDecorators = withErrorHandlingDecorator(deleteProduct);

export const productController = {
  create: createWithDecorators,
  getAll: getAllWithDecorators,
  getByUser: getByUserWithDecorators,
  getById: getByIdWithDecorators,
  session: sessionWithDecorators,
  webhook: webhookWithDecorators,
  getOrders: getOrdersWithDecorators,
  update: updateWithDecorators,
  delete: deleteWithDecorators,
};
