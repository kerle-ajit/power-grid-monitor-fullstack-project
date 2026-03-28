import { prisma } from "../../database/prismaClient";

export function createUserRepository() {
  return {
    async findByUsername(username: string) {
      return prisma.user.findUnique({
        where: { username },
        select: { id: true, role: true, passwordHash: true }
      });
    },

    async listUserZones(userId: string) {
      return prisma.userZone.findMany({
        where: { userId },
        select: { zoneId: true }
      });
    }
  };
}

