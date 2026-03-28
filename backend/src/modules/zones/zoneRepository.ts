import { prisma } from "../../database/prismaClient";

export function createZoneRepository() {
  return {
    listZones() {
      return prisma.zone.findMany({ orderBy: { name: "asc" } });
    }
  };
}

