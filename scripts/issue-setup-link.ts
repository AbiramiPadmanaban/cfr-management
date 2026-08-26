import "dotenv/config";
import { generateAuthToken, hashAuthToken } from "../lib/auth-token";
import { buildPasswordSetupUrl } from "../lib/email";
import { SETUP_TOKEN_TTL_MS } from "../modules/auth/domain/password-rules";
import { PrismaAuthRepository } from "../modules/auth/infrastructure/auth.prisma-repo";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx scripts/issue-setup-link.ts <email>");
    process.exit(1);
  }

  const repo = new PrismaAuthRepository();
  const user = await repo.findByEmail(email);
  if (!user) {
    console.error("User not found");
    process.exit(1);
  }

  await repo.invalidateUnusedTokens(user.id, "PASSWORD_SETUP");
  const token = generateAuthToken();
  await repo.createToken({
    userId: user.id,
    tokenHash: hashAuthToken(token),
    type: "PASSWORD_SETUP",
    expiresAt: new Date(Date.now() + SETUP_TOKEN_TTL_MS),
  });

  process.stdout.write(`${buildPasswordSetupUrl(token)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
