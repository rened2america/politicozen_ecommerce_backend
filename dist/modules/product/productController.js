"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productController = void 0;
const withErrorHandlingDecorator_1 = require("../../decorators/withErrorHandlingDecorator");
const productService_1 = __importDefault(require("./productService"));
//import { decode } from "base64-arraybuffer"; borrar
// import { Upload } from "@aws-sdk/lib-storage"; borrar
// import { S3Client } from "@aws-sdk/client-s3"; borrar
const initialConfig_1 = require("../../database/initialConfig");
const isJson_1 = require("../../utils/isJson");
const configStripe_1 = require("../../utils/configStripe");
const configAws_1 = require("../../utils/configAws");
const mathjs_1 = require("mathjs");
const generateCode_1 = require("../../utils/generateCode");
const artistDAO_1 = __importDefault(require("../artist/artistDAO"));
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { x, y, angle, scale, tags, type, groupId } = req.body;
    console.log("Distance x", x);
    console.log("Distance y", y);
    const xDecimal = (0, mathjs_1.round)(x, 6);
    const yDecimal = (0, mathjs_1.round)(y, 6);
    const angleDecimal = (0, mathjs_1.round)(angle, 6);
    const scaleDecimal = (0, mathjs_1.round)(scale, 6);
    console.log("Distance rounded x", xDecimal);
    console.log("Distance rounded y", yDecimal);
    const productName = req.body.name;
    const productSubtitle = req.body.subtitle;
    const productDescription = req.body.description;
    const s3 = (0, configAws_1.connectionAws)();
    const stripe = (0, configStripe_1.connectionStripe)();
    const priceOfProduct = (typeValue) => {
        if (typeValue === "Sweatshirt") {
            return 25.99;
        }
        if (typeValue === "Shirt") {
            return 15.99;
        }
        if (typeValue === "Hoodie") {
            return 36.99;
        }
        if (typeValue === "Mug") {
            return 24.99;
        }
    };
    const sizeofProdut = (typeValue) => {
        if (typeValue === "Mug") {
            return [
                {
                    where: { value: "11 oz" },
                    create: { value: "11 oz" },
                },
                {
                    where: { value: "15 oz" },
                    create: { value: "15 oz" },
                },
            ];
        }
        return [
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
            {
                where: { value: "XL" },
                create: { value: "XL" },
            },
            {
                where: { value: "2XL" },
                create: { value: "2XL" },
            },
            {
                where: { value: "3XL" },
                create: { value: "3XL" },
            },
            {
                where: { value: "4XL" },
                create: { value: "4XL" },
            },
            {
                where: { value: "5XL" },
                create: { value: "5XL" },
            },
        ];
    };
    // const colorsofProdut = (typeValue: string, selected:any) => {
    //   if (typeValue === "Mug") {
    //     return [
    //       {
    //         where: { value: "White" },
    //         create: { value: "White" },
    //       },
    //     ];
    //   }
    //   // const valueToReturn = selected.filter(()=> {
    //   //   return
    //   // })
    //   return [
    //     {
    //       where: { value: "White" },
    //       create: { value: "White" },
    //     },
    //     {
    //       where: { value: "Beige" },
    //       create: { value: "Beige" },
    //     },
    //     {
    //       where: { value: "Red" },
    //       create: { value: "Red" },
    //     },
    //     {
    //       where: { value: "Blue" },
    //       create: { value: "Blue" },
    //     },
    //     {
    //       where: { value: "Black" },
    //       create: { value: "Black" },
    //     },
    //   ];
    // };
    const colorsofProdut = (typeValue, selected) => {
        // Si el tipo es "Mug", retorna un array con solo el color "White"
        if (typeValue === "Mug") {
            return [
                {
                    where: { value: "White" },
                    create: { value: "White" },
                },
            ];
        }
        // Array para almacenar los colores seleccionados
        const colorsToReturn = [];
        // Iterar sobre los colores en 'selected'
        for (const color in selected) {
            // Verificar si el color está seleccionado
            if (selected[color]) {
                // Convertir la clave de 'selected' a formato de texto capitalizado
                const colorCapitalized = color.charAt(0).toUpperCase() + color.slice(1);
                // Agregar el color al array
                colorsToReturn.push({
                    where: { value: colorCapitalized },
                    create: { value: colorCapitalized },
                });
            }
        }
        return colorsToReturn;
    };
    const imageListFromProduct = (typeValue, images, selected) => {
        if (typeValue === "Mug") {
            return { white: images.white };
        }
        if (!selected.beige) {
            delete images.beige;
        }
        if (!selected.red) {
            delete images.red;
        }
        if (!selected.blue) {
            delete images.blue;
        }
        if (!selected.black) {
            delete images.black;
        }
        return images;
    };
    const sizeOptionsOfProduct = (typeValue) => {
        if (typeValue === "Mug") {
            return ["11 oz", "15 oz"];
        }
        return ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];
    };
    const logoURL = yield productService_1.default.uploadLogo(req.body.imgLogo, s3, productName);
    const imagesBuffer = yield productService_1.default.transformImagesFromBase64ToBuffer(imageListFromProduct(type, req.body.imgListProduct, req.body.colorsSelected));
    const ImagesUrl = yield productService_1.default.uploadImages(imagesBuffer, productName, s3);
    const productStripe = yield productService_1.default.createProductInStripe(ImagesUrl, stripe, productName, priceOfProduct(type), sizeOptionsOfProduct(type));
    const tagOperations = tags.map((tagValue) => ({
        where: { value: tagValue },
        create: { value: tagValue },
    }));
    const artistId = req.user.artistId;
    const newProduct = yield productService_1.default.create({
        price: priceOfProduct(type),
        title: productName,
        subtitle: productSubtitle,
        description: productDescription,
        artistId: artistId,
        idGeneral: (0, generateCode_1.generateCode)(),
        groupId,
        tag: {
            connectOrCreate: tagOperations,
        },
        types: {
            connectOrCreate: {
                where: { value: type },
                create: { value: type },
            },
        },
        sizes: {
            connectOrCreate: sizeofProdut(type),
        },
        colors: {
            connectOrCreate: colorsofProdut(type, req.body.colorsSelected),
        },
    });
    console.log("productStripe", productStripe);
    const productsToDb = productStripe.flat().map((product) => {
        console.log("product", product);
        return {
            //@ts-ignore
            productId: newProduct.id,
            positionX: xDecimal,
            positionY: yDecimal,
            angle: angleDecimal,
            scale: scaleDecimal,
            variant: product.color,
            price: priceOfProduct(type),
            priceId: product.id,
            url: product.imgProductURL,
            urlLogo: logoURL,
            artistId: artistId,
            size: product.size,
        };
    });
    const createManyDesign = yield initialConfig_1.prisma.design.createMany({
        //@ts-ignore
        data: productsToDb,
        skipDuplicates: true,
    });
    res.status(201).json({
        message: "Producto Creado",
        products: createManyDesign ? createManyDesign : [],
    });
});
const getByUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const artistId = req.user.artistId;
    const products = yield productService_1.default.getByUser(artistId);
    res.status(201).json({ message: "Producto Creado", products: products });
});
const getAll = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // const sortBy = req.query.sortBy || "desc";
    const search = req.query.search || "";
    const filter = req.query.filters || "";
    //@ts-ignore
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = 12;
    //@ts-ignore
    if ((0, isJson_1.isJson)(filter)) {
        //@ts-ignore
        const filterParse = JSON.parse(filter);
        const filterEntries = Object.entries(filterParse);
        const arrayFilter = filterEntries.map((entry) => {
            const newFilter = {};
            if (entry[0] === "artist") {
                //@ts-ignore
                newFilter[entry[0]] = {
                    OR: entry[1],
                };
                return newFilter;
            }
            else {
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
        const products = yield productService_1.default.getAll(arrayFilter, { page, limit });
        res.status(201).json({
            message: "Productos Obtenidos",
            products: products.products,
            count: products.count,
        });
        return;
    }
    else {
        const arrayFilter = [
            {
                title: {
                    contains: search,
                },
            },
        ];
        const products = yield productService_1.default.getAll(arrayFilter, {
            page,
            limit,
        });
        res.status(201).json({
            message: "Productos Obtenidos",
            products: products.products,
            count: products.count,
        });
    }
});
const getById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const productId = parseInt(req.params.id);
    //@ts-ignore
    const variant = req.query.variant ? req.query.variant : "white";
    //@ts-ignore
    const size = req.query.size ? req.query.size : "S";
    //@ts-ignore
    const products = yield productService_1.default.getById(productId, variant, size);
    res.status(201).json({ message: "Productos Obtenidos", products });
});
const session = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const NormalizeProducts = req.body.products.map((product) => {
        return {
            price: product.priceId,
            quantity: product.count,
        };
    });
    const stripe = (0, configStripe_1.connectionStripe)();
    const session = yield stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: NormalizeProducts,
        success_url: process.env.URL_ECOMMERCE + "/succes/",
        cancel_url: process.env.URL_ECOMMERCE + "/cancel/",
    });
    res
        .status(201)
        .json({ message: "Session obtenida", session: session ? session : {} });
});
const webhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const stripe = (0, configStripe_1.connectionStripe)();
    if (req.body.type === "checkout.session.completed") {
        const user = req.body.data.object.customer_details;
        const listData = yield stripe.checkout.sessions.listLineItems(req.body.data.object.id);
        const listPromise = listData.data.map((product) => __awaiter(void 0, void 0, void 0, function* () {
            const design = yield initialConfig_1.prisma.design.findFirst({
                where: {
                    //@ts-ignore
                    priceId: product.price.id,
                },
            });
            //@ts-ignore
            yield initialConfig_1.prisma.order.create({
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
                    artistId: design === null || design === void 0 ? void 0 : design.artistId,
                },
            });
        }));
        yield Promise.all(listPromise);
    }
    res.sendStatus(200);
});
const getOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const artistId = req.user.artistId;
    const today = new Date();
    const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
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
    const ordersCount = yield initialConfig_1.prisma.order.count({
        where: {
            artistId,
            createdAt: {
                gte: firstDayOfLastMonth,
                lte: lastDayOfLastMonth,
            },
        },
    });
    const orders = yield initialConfig_1.prisma.order.findMany({
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
    const totalAmount = orders.reduce((sum, order) => sum + parseInt(order.amount), 0);
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
        }
        else {
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
});
const update = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const productFromUser = req.body;
    const artistId = req.user.artistId;
    console.log("productFromUser:", productFromUser);
    const product = yield initialConfig_1.prisma.product.findUnique({
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
    const updatedProduct = yield initialConfig_1.prisma.product.update({
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
});
const deleteProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("aqui estoy");
    const productId = req.params.productId
        ? parseInt(req.params.productId)
        : null;
    console.log("hola", req.user);
    const artistId = req.user.artistId;
    console.log("artist", artistId);
    console.log("productId", productId);
    if (productId) {
        yield initialConfig_1.prisma.product.delete({
            where: {
                id: productId,
                artistId,
            },
        });
    }
    res.status(201).json({
        message: "Product delete",
    });
});
const createGroup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const artistId = req.user.artistId;
    //@ts-ignore
    const bufferArt = req.file.buffer;
    const name = req.body.name;
    const getArtist = yield artistDAO_1.default.getArtistById(artistId);
    const s3 = (0, configAws_1.connectionAws)();
    const paramsImgArt = {
        Bucket: process.env.BUCKET_IMG,
        //@ts-ignore
        Key: `${Date.now().toString()}-${getArtist.name}-Art`,
        Body: bufferArt,
        ContentType: "image/png",
    };
    //@ts-ignore
    const imgArtURL = yield s3.upload(paramsImgArt).promise();
    // await artistDAO.updateArtist(artistId, { avatar: imgArtURL.Location });
    yield initialConfig_1.prisma.group.create({
        data: {
            artistId,
            urlImage: imgArtURL.Location,
            //@ts-ignore
            name,
        },
    });
    res.status(200).json({
        message: "Updated image",
    });
});
const getGallery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const artistId = req.user.artistId;
    //@ts-ignore
    const gallery = yield initialConfig_1.prisma.group.findMany({
        where: {
            artistId,
        },
    });
    res.status(200).json({
        message: "List of gallery",
        gallery,
    });
});
const getGroupRelation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const artistId = 1;
    //@ts-ignore
    const groupRelation = yield initialConfig_1.prisma.group.findMany({
        take: 4,
        where: {
            artistId,
            product: {
                some: {},
            },
        },
        include: {
            product: {
                include: {
                    design: true,
                    types: true,
                },
            },
        },
    });
    res.status(200).json({
        message: "List of group relation",
        groupRelation,
    });
});
const getGroupRelationByArtist = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const artistId = 1;
    //@ts-ignore
    const groupRelation = yield initialConfig_1.prisma.group.findMany({
        where: {
            artistId,
            product: {
                some: {},
            },
        },
        include: {
            product: {
                include: {
                    design: true,
                    types: true,
                },
            },
        },
    });
    res.status(200).json({
        message: "List of group relation",
        groupRelation,
    });
});
const createWithDecorators = (0, withErrorHandlingDecorator_1.withErrorHandlingDecorator)(create);
const getAllWithDecorators = (0, withErrorHandlingDecorator_1.withErrorHandlingDecorator)(getAll);
const getByUserWithDecorators = (0, withErrorHandlingDecorator_1.withErrorHandlingDecorator)(getByUser);
const getByIdWithDecorators = (0, withErrorHandlingDecorator_1.withErrorHandlingDecorator)(getById);
const sessionWithDecorators = (0, withErrorHandlingDecorator_1.withErrorHandlingDecorator)(session);
const webhookWithDecorators = (0, withErrorHandlingDecorator_1.withErrorHandlingDecorator)(webhook);
const getOrdersWithDecorators = (0, withErrorHandlingDecorator_1.withErrorHandlingDecorator)(getOrders);
const updateWithDecorators = (0, withErrorHandlingDecorator_1.withErrorHandlingDecorator)(update);
const deleteWithDecorators = (0, withErrorHandlingDecorator_1.withErrorHandlingDecorator)(deleteProduct);
const createGroupWithDecorators = (0, withErrorHandlingDecorator_1.withErrorHandlingDecorator)(createGroup);
const getGalleryWithDecorators = (0, withErrorHandlingDecorator_1.withErrorHandlingDecorator)(getGallery);
const getGroupRelationWithDecorators = (0, withErrorHandlingDecorator_1.withErrorHandlingDecorator)(getGroupRelation);
const getGroupRelationByArtistWithDecorators = (0, withErrorHandlingDecorator_1.withErrorHandlingDecorator)(getGroupRelationByArtist);
exports.productController = {
    create: createWithDecorators,
    getAll: getAllWithDecorators,
    getByUser: getByUserWithDecorators,
    getById: getByIdWithDecorators,
    session: sessionWithDecorators,
    webhook: webhookWithDecorators,
    getOrders: getOrdersWithDecorators,
    update: updateWithDecorators,
    delete: deleteWithDecorators,
    createGroup: createGroupWithDecorators,
    getGallery: getGalleryWithDecorators,
    getGroupRelation: getGroupRelationWithDecorators,
    getGroupRelationByArtist: getGroupRelationByArtistWithDecorators,
};
