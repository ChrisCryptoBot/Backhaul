import type { Role } from "./rbac";
import { prisma } from "./db";
import { assertRegionAccess } from "./scope";
import { PolicyViolationError } from "./policy-error";

export interface RegionAccess {
  userId: string;
  regionId: string;
  role: Role;
}

export async function requireRegionAccess(userId: string, regionId: string): Promise<RegionAccess> {
  const membership = await prisma.userRegionRole.findUnique({
    where: {
      userId_regionId: {
        userId,
        regionId
      }
    }
  });

  if (!membership) {
    throw new PolicyViolationError("Forbidden for region");
  }

  await assertRegionAccess(
    {
      userId,
      regionId: membership.regionId,
      role: membership.role as Role
    },
    regionId
  );

  return {
    userId,
    regionId,
    role: membership.role as Role
  };
}
