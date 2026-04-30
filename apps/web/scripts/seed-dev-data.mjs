import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function toWeekIso(date) {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((target - yearStart) / 86400000) + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL. Set it in apps/web/.env.local before running seed:dev.");
  }

  const now = new Date();
  const pickupDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0));
  const weekIso = toWeekIso(pickupDate);

  const region = await prisma.region.upsert({
    where: { code: "NE" },
    update: { name: "Northeast" },
    create: { code: "NE", name: "Northeast" }
  });

  const user = await prisma.user.upsert({
    where: { id: "dev-seed-user" },
    update: { email: "dev-seed@example.invalid", name: "Dev Seed User" },
    create: { id: "dev-seed-user", email: "dev-seed@example.invalid", name: "Dev Seed User" }
  });

  await prisma.userRegionRole.upsert({
    where: { userId_regionId: { userId: user.id, regionId: region.id } },
    update: { role: "COORDINATOR" },
    create: { userId: user.id, regionId: region.id, role: "COORDINATOR" }
  });

  const dropLot = await prisma.dropLot.upsert({
    where: { id: "dev-seed-drop-lot-ne" },
    update: {
      name: "Dev Drop Lot",
      city: "Warrendale",
      state: "PA",
      regionId: region.id
    },
    create: {
      id: "dev-seed-drop-lot-ne",
      regionId: region.id,
      name: "Dev Drop Lot",
      city: "Warrendale",
      state: "PA",
      sortOrder: 10,
      dailyCapacity: 8,
      slipSeat: false,
      dropHookRequired: false
    }
  });

  const existingLoad = await prisma.load.findFirst({
    where: {
      regionId: region.id,
      threePlRefNumber: "DEV-REF-001",
      deletedAt: null
    },
    select: { id: true }
  });

  if (!existingLoad) {
    await prisma.load.create({
      data: {
        regionId: region.id,
        weekIso,
        pickupDate,
        status: "BOOKED",
        createdById: user.id,
        dropLotId: dropLot.id,
        bookingDate: pickupDate,
        routeId: "DEV-ROUTE-001",
        loadNumber: "DEV-LOAD-001",
        pickupNumber: "DEV-PICKUP-001",
        threePlRefNumber: "DEV-REF-001",
        shipperName: "Dev Shipper",
        pickupCity: "Warrendale",
        pickupState: "PA",
        receiverName: "Dev Receiver",
        deliveryCity: "Pittsburgh",
        deliveryState: "PA",
        lineHaulRate: "1800.00",
        loadedMiles: "260.0",
        puDeadheadMiles: "18.0",
        delDeadheadMiles: "12.0",
        fscApplies: true,
        fscAmount: "0.00"
      }
    });
  }

  console.log("Local dev seed ready for NE board workflow.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
