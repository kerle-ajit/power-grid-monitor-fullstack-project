import bcrypt from "bcryptjs";
import { z } from "zod";
import { httpError } from "../../utils/errors";
import { signAccessToken } from "../../utils/jwt";
import { createUserRepository } from "./userRepository";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

export function createAuthService() {
  const repo = createUserRepository();
  return {
    async login(input: unknown) {
      const parsed = loginSchema.parse(input);
      const user = await repo.findByUsername(parsed.username);
      if (!user) throw httpError(401, "Invalid credentials", "AUTH_INVALID");

      const ok = await bcrypt.compare(parsed.password, user.passwordHash);
      if (!ok) throw httpError(401, "Invalid credentials", "AUTH_INVALID");

      if (user.role === "OPERATOR") {
        const assignments = await repo.listUserZones(user.id);
        const zoneIds = assignments.map((a) => a.zoneId);
        if (zoneIds.length === 0) {
          throw httpError(403, "No zones assigned", "NO_ZONES");
        }

        const token = signAccessToken({
          sub: user.id,
          role: "OPERATOR",
          zoneIds
        });
        return { token, role: user.role, zoneIds };
      }

      const token = signAccessToken({ sub: user.id, role: "SUPERVISOR" });
      return { token, role: user.role, zoneIds: [] as string[] };
    }
  };
}

