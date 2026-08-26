import "dotenv/config";
import { hashPassword } from "../lib/password";
import { normalizeEmail } from "../modules/auth/domain/password-rules";
import { PrismaAuthRepository } from "../modules/auth/infrastructure/auth.prisma-repo";

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || "Administrator";

  if (!email || !password) {
    console.error(
      "Usage: npx tsx scripts/bootstrap-admin.ts <email> <password> [name]"
    );
    process.exit(1);
  }

  const authRepo = new PrismaAuthRepository();
  const normalized = normalizeEmail(email);
  let user = await authRepo.findByEmail(normalized);

  if (!user) {
    user = await authRepo.createUser({
      email: normalized,
      name,
      role: "ADMIN",
    });
    console.log(`Created admin user ${user.email}`);
  } else {
    console.log(`Admin user already exists: ${user.email}`);
  }

  const passwordHash = await hashPassword(password);
  await authRepo.setPassword(user.id, passwordHash);
  console.log("Password configured. You can sign in at /login.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
