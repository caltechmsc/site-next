/**
 * Infrastructure Verification Script
 *
 * Tests that all configuration and database modules work correctly.
 * Run: npx tsx src/scripts/verify-infra.ts
 */

import { prisma } from "../lib/db/client";
import { siteConfig, mainNav, features } from "../config/site";

async function main() {
  console.log("\n🔍 Verifying infrastructure...\n");

  // 1. Test site config
  console.log("📋 Site Config:");
  console.log(`   Name: ${siteConfig.name}`);
  console.log(`   Description: ${siteConfig.description.slice(0, 50)}...`);
  console.log(`   Nav items: ${mainNav.length}`);
  console.log(`   Dark mode: ${features.darkMode}`);
  console.log("   ✅ Site config OK\n");

  // 2. Test Prisma Client
  console.log("🗄️  Database:");
  try {
    const memberCount = await prisma.member.count();
    const pubCount = await prisma.publication.count();
    const areaCount = await prisma.researchArea.count();

    console.log(`   Members: ${memberCount}`);
    console.log(`   Publications: ${pubCount}`);
    console.log(`   Research Areas: ${areaCount}`);
    console.log("   ✅ Prisma Client OK\n");
  } catch (error) {
    console.log("   ❌ Database connection failed");
    console.log(`   Error: ${error}`);
    process.exit(1);
  }

  // 3. Test a simple query with relations
  console.log("🔗 Relations Test:");
  try {
    const memberWithPubs = await prisma.member.findFirst({
      include: {
        publications: {
          include: { publication: true },
          take: 1,
        },
        category: true,
      },
    });

    if (memberWithPubs) {
      console.log(`   Member: ${memberWithPubs.name}`);
      console.log(`   Category: ${memberWithPubs.category.name}`);
      console.log(`   Publications: ${memberWithPubs.publications.length}+`);
    } else {
      console.log("   No members found (seed data may be empty)");
    }
    console.log("   ✅ Relations OK\n");
  } catch (error) {
    console.log("   ❌ Relations query failed");
    console.log(`   Error: ${error}`);
    process.exit(1);
  }

  console.log("✅ All infrastructure checks passed!\n");
}

main()
  .catch((e) => {
    console.error("❌ Verification failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
