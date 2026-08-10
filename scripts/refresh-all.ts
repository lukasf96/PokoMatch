import { spawn } from "node:child_process";
import process from "node:process";

const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

function runScript(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(pnpmCommand, ["run", name], {
      env: process.env,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) resolve();
      else {
        reject(
          new Error(
            `${name} failed${signal ? ` with signal ${signal}` : ` with exit code ${String(code)}`}`,
          ),
        );
      }
    });
  });
}

async function main(): Promise<void> {
  // Sprites consume the freshly generated dex. Items are independent and can
  // overlap sprite downloads/encoding without increasing traffic to Serebii.
  await runScript("refresh-dex");
  const results = await Promise.allSettled([
    runScript("refresh-sprites"),
    runScript("refresh-items"),
  ]);
  const failures = results
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .map((result) => result.reason);
  if (failures.length > 0) {
    throw new AggregateError(failures, "One or more refresh stages failed.");
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
