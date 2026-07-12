import { prisma } from "../../db/client";
import { LoginInput } from "./auth.schema";
import { UnauthorizedError } from "../../shared/errors";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { UserRole } from "@prisma/client";
import { verifyPassword } from "../../utils/hash";

// Simple mapping from UI string to Prisma Enum
const mapRole = (role: string): UserRole => {
  switch (role) {
    case "Fleet Manager": return UserRole.FLEET_MANAGER;
    case "Dispatcher": return UserRole.DISPATCHER;
    case "Safety Officer": return UserRole.SAFETY_OFFICER;
    case "Financial Analyst": return UserRole.FINANCIAL_ANALYST;
    default: return UserRole.FLEET_MANAGER;
  }
};

export class AuthService {
  async login(input: LoginInput) {
    const prismaRole = mapRole(input.role);

    const user = await prisma.user.findUnique({
      where: { email: input.email }
    });

    if (!user) {
      throw new UnauthorizedError("User not found");
    } 

    if (user.role !== prismaRole) {
      throw new UnauthorizedError(`User does not have role: ${input.role}`);
    }

    if (!verifyPassword(input.password, user.password)) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const payload = {
      userId: user.id,
      role: user.role
    };

    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: input.remember ? "7d" : "1d"
    });

    return { token, user: { id: user.id, email: user.email, name: user.name, role: input.role } };
  }
}
