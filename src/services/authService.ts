import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { RegisterInput, LoginInput } from "../schemas/auth.schema";

const JWT_SECRET = process.env.JWT_SECRET as string;

export const authService = {
  async register(data: RegisterInput) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { username: data.username }] },
    });
    if (existing) {
      throw new AppError(409, "Email or username already in use");
    }

    const hashed = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { username: data.username, email: data.email, password: hashed },
      select: { id: true, username: true, email: true, createdAt: true },
    });
    return user;
  },

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    // Same error for unknown email or wrong password — don't leak which one
    if (!user || !(await bcrypt.compare(data.password, user.password))) {
      throw new AppError(401, "Invalid credentials");
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });
    return { token };
  },

  async me(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true, createdAt: true },
    });
    if (!user) throw new AppError(404, "User not found");
    return user;
  },
};
