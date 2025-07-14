import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  image: z.string().url(),
  categoryId: z.string().min(1),
  stock: z.number().int().nonnegative(),
});

// Đưa ra ngoài block và khai báo kiểu
type CategoryType = { id: string; parentId: string | null };
function buildCategoryPath(category: CategoryType | null, allCategories: CategoryType[], path: string[] = []): string[] {
  if (!category) return path;
  path.unshift(category.id);
  if (category.parentId) {
    const parent = allCategories.find((c) => c.id === category.parentId) || null;
    return buildCategoryPath(parent, allCategories, path);
  }
  return path;
}

export async function GET(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const id = params.productId;

    if (!id) {
        return NextResponse.json({ error: "Missing product ID" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: true,
        productAttributes: {
          include: {
            attribute: true,
          },
        },
        productTrends: {
          include: {
            trend: true,
          }
        }
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Sản phẩm không tồn tại" },
        { status: 404 }
      );
    }

    // Chuẩn hóa trả về: thêm trường variants chuẩn cho FE
    const variants = product.variants.map(v => ({
      id: v.id,
      color: v.color,
      size: v.size,
      stock: v.stock,
      sku: v.sku,
      price: v.price,
      salePrice: v.salePrice,
      image: v.image,
    }));

    // Lấy tất cả categories
    const allCategories = await prisma.category.findMany({ select: { id: true, parentId: true } });
    const categoryPath = buildCategoryPath(product.category, allCategories);

    // Lấy attributeIds
    const attributeIds = product.productAttributes.map(pa => pa.attributeId);
    // Lấy trendId (nếu có)
    const trendId = product.productTrends[0]?.trendId || null;

    // Lấy tất cả ProductImage cho sản phẩm này
    const productImages = await prisma.productImage.findMany({
      where: { productId: product.id },
      orderBy: [
        { isMain: 'desc' }, // Ảnh chính lên đầu
        { order: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    // Tính tổng số lượng đã bán của tất cả biến thể sản phẩm này trong các đơn hàng DELIVERED
    const soldAgg = await prisma.orderItem.aggregate({
      where: {
        productVariant: { productId: product.id },
        order: { status: 'DELIVERED' }
      },
      _sum: { quantity: true }
    });
    const sold = soldAgg._sum.quantity || 0;

    return NextResponse.json({
      ...product,
      attributes: product.productAttributes ? product.productAttributes.map(pa => ({
        id: pa.attribute && 'id' in pa.attribute ? pa.attribute.id : '',
        name: pa.attribute && 'name' in pa.attribute ? pa.attribute.name : '',
        value: 'value' in pa ? pa.value : (pa.attribute && 'value' in pa.attribute ? pa.attribute.value : ''),
        type: pa.attribute && 'type' in pa.attribute ? pa.attribute.type : '',
      })) : [],
      images: productImages,
      price: 'price' in product ? product.price : 0,
      salePrice: 'salePrice' in product ? product.salePrice : null,
      variants,
      categoryPath,
      attributeIds,
      trendId,
      sold,
    });

  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Lỗi khi tải thông tin sản phẩm" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = productSchema.parse(body);

    const product = await prisma.product.update({
      where: { id: params.productId },
      data: validatedData,
      include: {
        category: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await prisma.product.delete({
      where: { id: params.productId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 