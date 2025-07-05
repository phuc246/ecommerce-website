import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(request: Request, { params: { productId } }: { params: { productId: string } }) {
  try {
    const session = await getServerSession(authOptions);
  const data = await request.json();
    const { name, description, image, images, categoryId, trendId, attributeIds, variants } = data;
    if (!name || !image || !categoryId || !variants || !Array.isArray(variants) || variants.length === 0) {
      return NextResponse.json({ error: "Missing required fields or invalid variants" }, { status: 400 });
    }
    // Validate variants
    for (const variant of variants) {
      if (variant.price == null || !Array.isArray(variant.sizes) || variant.sizes.length === 0) {
        return NextResponse.json({ error: `Biến thể không hợp lệ: Thiếu giá hoặc chưa có kích thước.` }, { status: 400 });
      }
      for (const sz of variant.sizes) {
        if (!sz.size || sz.stock == null || isNaN(sz.stock) || sz.stock < 0) {
          return NextResponse.json({ error: `Biến thể không hợp lệ: Kích thước hoặc số lượng không hợp lệ.` }, { status: 400 });
        }
      }
    }
    // Lấy trạng thái trước khi sửa
    const before = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: true,
        productAttributes: true,
        productTrends: true,
        category: true,
      },
    });
    // Xóa hết variants, attributes, trends cũ
    await prisma.productVariant.deleteMany({ where: { productId } });
    await prisma.productAttribute.deleteMany({ where: { productId } });
    await prisma.productTrend.deleteMany({ where: { productId } });
    // Cập nhật sản phẩm
    const updated = await prisma.product.update({
    where: { id: productId },
    data: {
        name,
        description: description || "Đang cập nhật",
        image,
        images: images || [],
        category: { connect: { id: categoryId } },
        variants: {
          create: variants.flatMap((variant: any) =>
            variant.sizes.map((sz: any) => ({
              color: variant.color,
              colorHex: variant.colorHex,
              size: sz.size,
              price: parseFloat(variant.price),
              salePrice: variant.salePrice ? parseFloat(variant.salePrice) : null,
              stock: parseInt(sz.stock, 10),
              sku: variant.sku || null,
              image: variant.image || null,
            }))
          ),
        },
        productAttributes: {
          create: attributeIds?.map((attrId: string) => ({
            attribute: { connect: { id: attrId } },
          })) || [],
        },
        productTrends: trendId ? {
          create: {
            trend: { connect: { id: trendId } },
          },
        } : undefined,
      },
      include: { variants: true, category: true }
    });
    // Rút gọn thông tin log
    function getSummary(product: any, attributeIds: string[], variants: any[]) {
      return {
        name: product.name,
        totalVariants: variants?.length || 0,
        sizes: Array.from(new Set(variants?.flatMap((v: any) => (v.sizes?.map((sz: any) => sz.size) || [])))),
        totalAttributes: attributeIds?.length || 0,
      };
    }
    const beforeSummary = before ? getSummary(before, before?.productAttributes?.map((a: any) => a.attributeId), before?.variants) : null;
    const afterSummary = getSummary(updated, attributeIds, variants);
    // So sánh thay đổi
    const changes = [];
    if (beforeSummary?.name !== afterSummary.name) changes.push({ field: 'name', from: beforeSummary?.name, to: afterSummary.name });
    if (beforeSummary?.totalVariants !== afterSummary.totalVariants) changes.push({ field: 'totalVariants', from: beforeSummary?.totalVariants, to: afterSummary.totalVariants });
    if (JSON.stringify(beforeSummary?.sizes) !== JSON.stringify(afterSummary.sizes)) changes.push({ field: 'sizes', from: beforeSummary?.sizes, to: afterSummary.sizes });
    if (beforeSummary?.totalAttributes !== afterSummary.totalAttributes) changes.push({ field: 'totalAttributes', from: beforeSummary?.totalAttributes, to: afterSummary.totalAttributes });
    // Ghi log thao tác
    await prisma.log.create({
      data: {
        adminId: session?.user?.id || null,
        userEmail: session?.user?.email || null,
        level: 'info',
        action: 'UPDATE',
        entity: 'product',
        entityId: updated.id,
        message: `Admin ${session?.user?.email || 'unknown'} (${session?.user?.role || 'unknown'}) đã cập nhật sản phẩm`,
        details: {
          before: beforeSummary,
          after: afterSummary,
          changes: changes,
        },
      },
  });
  return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 