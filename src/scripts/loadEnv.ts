import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

// @ts-expect-error toJSON is not defined, we define it here
BigInt.prototype.toJSON = function() { return this.toString() }