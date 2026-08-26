import "dotenv/config";
import { createUserWithSetupEmail } from "../modules/auth/presentation/lib/auth-service";

async function main() {
  const email = process.argv[2];
  const name = process.argv[3] || null;
  const roleArg = (process.argv[4] || "ADMIN").toUpperCase();
  const role = roleArg === "USER" ? "USER" : "ADMIN";

  if (!email) {
    console.error("Usage: npx tsx scripts/create-user.ts <email> [name] [ADMIN|USER]");
    process.exit(1);
  }

  const result = await createUserWithSetupEmail({ email, name, role });
  if (!result.ok) {
    console.error(result.error);
    process.exit(1);
  }

  console.log(`Created user ${result.user.email} (${result.user.role}).`);
  if (result.emailSent) {
    console.log("Password setup email sent.");
  } else {
    console.warn("User created, but setup email failed:");
    console.warn(result.emailError || "Unknown email error");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
