import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { getToken } from "next-auth/jwt";
import bcrypt from "bcrypt";

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

async function getSessionUser(req: NextRequest): Promise<{ id?: string; email?: string } | null> {
  const token = await getToken({ req, secret: NEXTAUTH_SECRET });
  if (!token) return null;
  return { id: typeof token.sub === "string" ? token.sub : undefined, email: token.email ?? undefined };
}

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findFirst({
    where: sessionUser.id
      ? { id: sessionUser.id }
      : sessionUser.email
      ? { email: sessionUser.email }
      : { id: "__never__" },
    select: { id: true, name: true, email: true, createdAt: true, updatedAt: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ user });
}

const ProfileSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(100, "Name is too long"),
  email: z.string().trim().email("Invalid email").max(190),
  passwordNew: z.string().min(6, "Password must be at least 6 characters").max(128).optional(),
  passwordConfirm: z.string().optional(),
});

export async function PUT(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = ProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { name, email, passwordNew, passwordConfirm } = parsed.data;

  const current = await prisma.user.findFirst({
    where: sessionUser.id
      ? { id: sessionUser.id }
      : sessionUser.email
      ? { email: sessionUser.email }
      : { id: "__never__" },
    select: { id: true, email: true },
  });
  if (!current) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const clash = await prisma.user.findFirst({
    where: { email, NOT: { id: current.id } },
    select: { id: true },
  });
  if (clash) return NextResponse.json({ error: "Email is already in use" }, { status: 409 });

  const data: any = { name, email };
  let passwordUpdated = false;

  if (passwordNew && passwordConfirm && passwordNew === passwordConfirm) {
    const hash = await bcrypt.hash(passwordNew, 10);
    data.passwordHash = hash;
    passwordUpdated = true;
  }

  const updated = await prisma.user.update({
    where: { id: current.id },
    data,
    select: { id: true, name: true, email: true, updatedAt: true },
  });

  return NextResponse.json({ user: updated, passwordUpdated });
}