import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

function getSummary(product: any, attributeIds: string[], variants: any[]) {
  return {
    name: product.name,
    totalVariants: variants?.length || 0,
    sizes: Array.from(new Set(variants?.flatMap((v: any) => (v.sizes?.map((sz: any) => sz.size) || [])))),
    totalAttributes: attributeIds?.length || 0,
  };
}

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
    // Kiểm tra trùng lặp size trong từng biến thể màu trước khi flatten
    for (const variant of variants) {
      const sizeSet = new Set();
      for (const sz of variant.sizes) {
        const sizeKey = (sz.size || '').trim().toUpperCase();
        if (sizeSet.has(sizeKey)) {
          return NextResponse.json({ error: `Màu ${variant.color} có 2 size trùng nhau: ${sizeKey}` }, { status: 400 });
        }
        sizeSet.add(sizeKey);
      }
    }
    // Lấy trạng thái trước khi sửa (phục vụ log)
    const before = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: true,
        productAttributes: true,
        productTrends: true,
        category: true,
      },
    });
    // Chuẩn hoá danh sách variant mới (theo từng size/color)
    const newVariantsFlat = variants.flatMap((variant: any) =>
      variant.sizes.map((sz: any) => ({
        color: (variant.color || '').trim().toLowerCase(),
        size: (sz.size || '').trim().toUpperCase(), // CHUẨN HÓA SIZE VỀ CHỮ HOA
        price: parseFloat(variant.price),
        salePrice: variant.salePrice ? parseFloat(variant.salePrice) : null,
        stock: parseInt(sz.stock, 10),
        sku: variant.sku || null,
        image: variant.image || null,
        isActive: true,
      }))
    );

    // Kiểm tra trùng lặp color + size trong variants mới
    const seen = new Set();
    for (const v of newVariantsFlat) {
      const key = `${v.color}__${v.size}`;
      if (seen.has(key)) {
        return NextResponse.json({ error: `Có 2 biến thể trùng màu (${v.color}) và size (${v.size})` }, { status: 400 });
      }
      seen.add(key);
    }

    // XÓA logging debug chi tiết
    // (Xóa các dòng console.log liên quan đến variant insert, oldVariants, afterDeleteVariants, error inserting variant)

    // Transaction: Xóa/ẩn toàn bộ variant cũ trước khi insert variant mới
    await prisma.$transaction(async (tx) => {
      // 1. Lấy toàn bộ variant cũ
      const oldVariants = await tx.productVariant.findMany({ where: { productId } });
      const oldVariantIds = oldVariants.map(v => v.id);

      // 2. Kiểm tra variant nào đã từng có OrderItem/Review
      const variantWithOrder = await tx.orderItem.findMany({ where: { productVariantId: { in: oldVariantIds } }, select: { productVariantId: true } });
      const variantWithReview = await tx.review.findMany({ where: { productVariantId: { in: oldVariantIds } }, select: { productVariantId: true } });
      const protectedIds = new Set([
        ...variantWithOrder.map(v => v.productVariantId),
        ...variantWithReview.map(v => v.productVariantId)
      ]);
      for (const old of oldVariants) {
        if (protectedIds.has(old.id)) {
          await tx.productVariant.update({ where: { id: old.id }, data: { isActive: false } });
        } else {
          await tx.productVariant.delete({ where: { id: old.id } });
        }
      }

      // 3. Log lại variant còn lại trong DB sau khi xóa/ẩn
      const afterDeleteVariants = await tx.productVariant.findMany({ where: { productId } });

      // 4. Insert toàn bộ variant mới (sau khi đã xóa/ẩn hết variant cũ)
      for (const v of newVariantsFlat) {
        try {
          await tx.productVariant.create({
            data: {
              productId,
              ...v,
            },
          });
        } catch (err) {
          console.error('Error inserting variant:', v, err);
          throw err;
        }
      }
    });

    await prisma.productAttribute.deleteMany({ where: { productId } });
    await prisma.productTrend.deleteMany({ where: { productId } });
    // Cập nhật sản phẩm (KHÔNG truyền variants: { create: ... } nữa)
    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        description: description || "Đang cập nhật",
        image,
        images: images && images.length > 0 ? { create: images } : undefined,
        category: { connect: { id: categoryId } },
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