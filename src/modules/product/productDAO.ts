import { prisma } from "../../database/initialConfig";

class ProductDAO {
  create = async (data: any) => {
    try {
      const newProduct = await prisma.product.create({
        data,
      });
      return newProduct;
    } catch (error) {
      console.log("localError", error);
      return error;
    }
  };

  getByUser = async (artistId: number) => {
    console.log(artistId);
    const allProducts = await prisma.product.findMany({
      where: {
        artistId,
      },
    });
    return allProducts;
  };

  getAll = async (filters: any, page: any) => {
    console.log("Before filter: ", filters)
    const hasTypefilter = filters.some((item: any) => item.hasOwnProperty('types'));
    // If no filter is applied then we shouldn't show Canvases
    if (!hasTypefilter) {
      filters.push({
        types: {
          none: {
            value: { in: ["Canvas"] }
          }
        }
      });
    }
    console.log(filters)
    const [allProducts, count] = await prisma.$transaction([
      prisma.product.findMany({
        skip: (page.page - 1) * page.limit,
        take: page.limit,
        where: {
          AND: filters,
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
      prisma.product.count({
        where: {
          AND: filters,
        },
      }),
    ]);
    return { products: allProducts, count: count };
  };
  getAllImages = async (productId: number) => {
    console.log("productId: ", productId);
    const images = await prisma.design.findMany({
      where: {
        productId: {
          equals: productId
        },
      },
      select: {
        url: true
      },
      distinct: ['url'],
    });
    return { images };
  };
  getById = async (
    id: number,
    variant: string,
    size: string,
    product: string
  ) => {
    console.log("getById", id);
    const groupProduct = await prisma.group.findUnique({
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

    const filterProductByGroup = await prisma.product.findFirst({
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
      const filterDesignByProduct = await prisma.design.findFirst({
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
    const filterDesignByProduct = await prisma.design.findFirst({
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
  };
  generateRandomArt = async () => {
    const artIds = await prisma.group.findMany({
      where: {
        product: {
          some: {},
        },
      },
      select: {
        id: true,
      },
    });

    // Extract the IDs into an array
    const ids = artIds.map((art) => ({ groupId: art.id }));

    // Shuffle the IDs to randomize them
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }

    // Select the first 15 IDs from the shuffled array
    const randomIds = ids.slice(0, 16);

    const deleteAllRandomArts = await prisma.randomArtsHomepage.deleteMany({});
    console.log(`${deleteAllRandomArts.count} arts deleted from randomArts table`)
    const createRandomArts = await prisma.randomArtsHomepage.createMany({ data: randomIds })
    console.log(`${createRandomArts.count} random arts inserted to randomArts table`)
  }
}

export default new ProductDAO();
