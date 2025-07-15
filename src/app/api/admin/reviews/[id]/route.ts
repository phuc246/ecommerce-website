import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PATCH: Admin trả lời review
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  }
  const { id } = params;
  const { reply } = await req.json();
  if (!reply) return NextResponse.json({ error: 'Thiếu nội dung trả lời' }, { status: 400 });
  try {
    const review = await prisma.review.update({ where: { id }, data: { reply } });
    return NextResponse.json(review);
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi khi trả lời đánh giá' }, { status: 500 });
  }
}

// DELETE: Admin xóa review
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  }
  const { id } = params;
  try {
    await prisma.review.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi khi xóa đánh giá' }, { status: 500 });
  }
} 