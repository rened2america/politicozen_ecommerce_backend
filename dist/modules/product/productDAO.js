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
Object.defineProperty(exports, "__esModule", { value: true });
const initialConfig_1 = require("../../database/initialConfig");
class ProductDAO {
    constructor() {
        this.create = (data) => __awaiter(this, void 0, void 0, function* () {
            try {
                const newProduct = yield initialConfig_1.prisma.product.create({
                    data,
                });
                return newProduct;
            }
            catch (error) {
                console.log("localError", error);
                return error;
            }
        });
        this.getByUser = (artistId) => __awaiter(this, void 0, void 0, function* () {
            console.log(artistId);
            const allProducts = yield initialConfig_1.prisma.product.findMany({
                where: {
                    artistId,
                },
            });
            return allProducts;
        });
        this.getAll = (filters, page) => __awaiter(this, void 0, void 0, function* () {
            const [allProducts, count] = yield initialConfig_1.prisma.$transaction([
                initialConfig_1.prisma.product.findMany({
                    skip: (page.page - 1) * page.limit,
                    take: page.limit,
                    where: {
                        AND: filters,
                        // AND: {
                        //   artist: {
                        //     OR: [
                        //       {
                        //         name: "Rene Alberto Meza Escamilla",
                        //       },
                        //       {
                        //         name: "Rene Meza",
                        //       },
                        //     ],
                        //   },
                        // },
                    },
                    include: {
                        design: true,
                        tag: true,
                        types: true,
                        artist: true,
                        group: {
                            select: {
                                id: true,
                            },
                        },
                    },
                }),
                initialConfig_1.prisma.product.count({
                    where: {
                        AND: filters,
                    },
                }),
            ]);
            console.log(count);
            return { products: allProducts, count: count };
        });
        this.getById = (id, variant, size, product) => __awaiter(this, void 0, void 0, function* () {
            console.log("getById", id);
            const groupProduct = yield initialConfig_1.prisma.group.findUnique({
                where: {
                    id,
                },
                include: {
                    artist: {
                        select: {
                            name: true,
                        },
                    },
                    product: {
                        select: {
                            types: true,
                        },
                    },
                },
            });
            const filterProductByGroup = yield initialConfig_1.prisma.product.findFirst({
                where: {
                    groupId: groupProduct.id,
                    types: {
                        some: {
                            value: product,
                        },
                    },
                },
                include: {
                    sizes: true,
                    colors: true,
                    tag: true,
                },
            });
            if (product === "Poster" || product === "Canvas") {
                const filterDesignByProduct = yield initialConfig_1.prisma.design.findFirst({
                    where: {
                        productId: filterProductByGroup.id,
                        size,
                    },
                });
                return {
                    groupProduct,
                    filterProductByGroup,
                    filterDesignByProduct,
                };
            }
            const filterDesignByProduct = yield initialConfig_1.prisma.design.findFirst({
                where: {
                    productId: filterProductByGroup.id,
                    variant,
                    size,
                },
            });
            console.log("groupProduct", groupProduct);
            console.log("filterProductByGroup", filterProductByGroup);
            console.log("filterDesignByProduct", filterDesignByProduct);
            // const allProducts = await prisma.product.findUnique({
            //   where: {
            //     id,
            //   },
            //   include: {
            //     group: {
            //       include: {
            //         product: {
            //           select: {
            //             types: true,
            //           },
            //         },
            //       },
            //     },
            //     design: true,
            //     sizes: true,
            //     colors: true,
            //     tag: true,
            //     artist: {
            //       select: {
            //         name: true,
            //       },
            //     },
            //   },
            // });
            console.log("allProducts", groupProduct);
            return {
                groupProduct,
                filterProductByGroup,
                filterDesignByProduct,
            };
        });
    }
}
exports.default = new ProductDAO();
