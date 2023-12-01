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
            console.log(page);
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
        this.getById = (id, variant, size) => __awaiter(this, void 0, void 0, function* () {
            console.log("getById", id);
            const groupProduct = yield initialConfig_1.prisma.group.findUnique({
                where: {
                    id: 5,
                },
                include: {
                    artist: {
                        select: {
                            name: true,
                        },
                    },
                    product: {
                        include: {
                            design: true,
                            sizes: true,
                            colors: true,
                            tag: true,
                            types: true,
                        },
                    },
                },
            });
            const allProducts = yield initialConfig_1.prisma.product.findUnique({
                where: {
                    id,
                },
                include: {
                    design: true,
                    sizes: true,
                    colors: true,
                    tag: true,
                    artist: {
                        select: {
                            name: true,
                        },
                    },
                },
            });
            console.log("allProducts", allProducts);
            return groupProduct;
        });
    }
}
exports.default = new ProductDAO();
