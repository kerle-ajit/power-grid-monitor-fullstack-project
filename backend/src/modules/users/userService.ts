import { prisma } from "../../database/prismaClient";

export function createUsersService() {
  return {
    listUsers() {
      return prisma.user.findMany({
        select: {
          id: true,
          username: true,
          role: true
        },
        orderBy: { username: "asc" }
      });
    }
  };
}

