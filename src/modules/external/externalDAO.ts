import { prisma } from "../../database/initialConfig";

class ExternalDAO {

  createRequest = async (data: any) => {
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

  createToken = async (data: any) => {
    try {
      const newToken = await prisma.tokens.create({
        data,
      });
      return newToken;
    } catch (error) {
      console.log("localError", error);
      return error;
    }
  };

  updateToken = async (tokenId: number, data: { token: string }) => {
    try {
      const updatedToken = await prisma.tokens.update({
        where: { id: tokenId },
        data: { token: data.token }
      });
      return updatedToken;
    } catch (error) {
      console.log("localError", error);
      return error;
    }
  };

  getAllRequests = async () => {
    try {
      const requests = await prisma.requests.findMany({});
      return requests;
    } catch (error) {
      console.log("localError: ", error);
      return error;
    }
  };

  deleteRequest = async (requestID: number) => {
    try {
      const deleted = await prisma.requests.delete({where: {id: requestID}});
      return !!deleted;
    } catch (error) {
      console.log("localError: ", error);
      return error;
    }
  };
}

export default new ExternalDAO();