import { randomBytes } from "crypto";

export function randomTokenHex(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}
