import { prisma } from "../../database/initialConfig";

class ExternalDAO {

    create = async (data: any) => {
        try {
          const newRequest = await prisma.requests.create({
            data,
          });
          return newRequest;
        } catch (error) {
          console.log("localError", error);
          return error;
        }
      };

}

export default new ExternalDAO();