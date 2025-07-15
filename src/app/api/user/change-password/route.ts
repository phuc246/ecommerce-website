import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  }
  const { oldPassword, newPassword } = await req.json();
  if (!oldPassword || !newPassword) {
    return NextResponse.json({ error: 'Thiếu thông tin.' }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user || !user.password) {
    return NextResponse.json({ error: 'Không tìm thấy user.' }, { status: 404 });
  }
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    return NextResponse.json({ error: 'Mật khẩu cũ không đúng.' }, { status: 400 });
  }
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { email: session.user.email }, data: { password: hashed } });
  return NextResponse.json({ success: true });
} 