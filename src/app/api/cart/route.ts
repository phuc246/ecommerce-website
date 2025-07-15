import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

// Helper function to get or create cart
async function getOrCreateCart(userId?: string) {
  // If user is logged in, get their cart
  if (userId) {
    // Kiểm tra userId có tồn tại không
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error("User không tồn tại, vui lòng đăng nhập lại.");
    }
    let cart = await prisma.cart.findFirst({
      where: { userId },
      include: { items: true },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: { items: true },
      });
    }

    return cart;
  } 
  
  // For anonymous users, use cookie-based cart
  const cookieStore = cookies();
  let cartId = cookieStore.get("cartId")?.value;

  // Nếu không có userId thì không tạo cart (Cart model yêu cầu userId)
  if (!userId) {
    return null;
  }

  let cart = await prisma.cart.findFirst({
    where: { id: cartId },
    include: { items: true },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { id: cartId, userId: userId },
      include: { items: true },
    });
  }

  return cart;
}

// GET cart items
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    const cart = await getOrCreateCart(userId);
    if (!cart) {
      return NextResponse.json(
        { error: "Không thể tạo hoặc lấy giỏ hàng" },
        { status: 500 }
      );
    }
    
    // Fetch detailed cart items with productVariant and product information
    const cartItems = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        productVariant: {
      include: {
        product: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
          },
        },
      },
    });
    
    // Calculate totals
    const subtotal = cartItems.reduce(
      (sum, item) => sum + (item.productVariant?.price || 0) * item.quantity,
      0
    );
    
    return NextResponse.json({
      items: cartItems.map(item => ({
        ...item,
        salePrice: item.productVariant?.salePrice ?? null,
        variantImage: item.productVariant?.image || item.productVariant?.product?.image || '',
        stock: item.productVariant?.stock ?? 0, // Thêm trường stock
      })),
      subtotal,
      count: cartItems.length,
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Lỗi khi tải giỏ hàng" },
      { status: 500 }
    );
  }
}

// POST add to cart
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để thêm vào giỏ hàng" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { productId, colorId, sizeId, quantity } = body;
    
    // Validate request
    if (!productId || !colorId || !sizeId || !quantity) {
      return NextResponse.json(
        { error: "Thiếu thông tin sản phẩm (productId, colorId, sizeId, quantity)" },
        { status: 400 }
      );
    }
    
    // Validate quantity
    if (typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json(
        { error: "Số lượng phải là số dương" },
        { status: 400 }
      );
    }
    
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    
    if (!product) {
      return NextResponse.json(
        { error: "Sản phẩm không tồn tại" },
        { status: 404 }
      );
    }
    
    // Check if variant exists (dùng colorId/sizeId là tên nếu không có bảng Color/Size)
    const variant = await prisma.productVariant.findFirst({
      where: {
        productId,
        color: String(colorId),
        size: String(sizeId),
      },
    });
    
    if (!variant) {
      return NextResponse.json(
        { error: "Biến thể không hợp lệ (màu sắc hoặc kích thước không tồn tại)" },
        { status: 400 }
      );
    }
    
    // Kiểm tra tồn kho
    if (variant.stock <= 0) {
      return NextResponse.json(
        { error: "Sản phẩm đã hết hàng!" },
        { status: 400 }
      );
    }
    
    // Nếu đã có trong giỏ, cộng dồn số lượng
    const cart = await getOrCreateCart(userId);
    if (!cart) {
      return NextResponse.json(
        { error: "Không thể tạo hoặc lấy giỏ hàng" },
        { status: 500 }
      );
    }
    
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productVariantId: variant.id,
      },
    });
    
    const totalQuantity = (existingItem ? existingItem.quantity : 0) + quantity;
    if (variant.stock < totalQuantity) {
      return NextResponse.json(
        { error: `Chỉ còn ${variant.stock} sản phẩm trong kho!` },
        { status: 400 }
      );
    }

    // Check if item already exists in cart (the same variant)
    if (existingItem) {
      // Update quantity
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      // Create new cart item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productVariantId: variant.id,
          quantity,
        },
      });
    }
    
    return NextResponse.json({ 
      success: true,
      message: "Đã thêm vào giỏ hàng thành công"
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      { error: "Lỗi khi thêm vào giỏ hàng" },
      { status: 500 }
    );
  }
}

// PUT update cart item
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    const body = await request.json();
    const { id, quantity } = body;
    
    // Validate request
    if (!id || quantity === undefined) {
      return NextResponse.json(
        { error: "Thiếu thông tin cần thiết" },
        { status: 400 }
      );
    }
    
    // Get cart
    const cart = await getOrCreateCart(userId);
    if (!cart) {
      return NextResponse.json(
        { error: "Không thể tạo hoặc lấy giỏ hàng" },
        { status: 500 }
      );
    }
    
    // Find the cart item
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id,
        cartId: cart.id,
      },
    });
    
    if (!cartItem) {
      return NextResponse.json(
        { error: "Sản phẩm không tồn tại trong giỏ hàng" },
        { status: 404 }
      );
    }
    
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      await prisma.cartItem.delete({
        where: { id },
      });
    } else {
      // Update quantity
      await prisma.cartItem.update({
        where: { id },
        data: { quantity },
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating cart:", error);
    return NextResponse.json(
      { error: "Lỗi khi cập nhật giỏ hàng" },
      { status: 500 }
    );
  }
}

// DELETE remove from cart
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "Thiếu ID sản phẩm" },
        { status: 400 }
      );
    }
    
    // Get cart
    const cart = await getOrCreateCart(userId);
    if (!cart) {
      return NextResponse.json(
        { error: "Không thể tạo hoặc lấy giỏ hàng" },
        { status: 500 }
      );
    }
    
    // Find the cart item
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id,
        cartId: cart.id,
      },
    });
    
    if (!cartItem) {
      return NextResponse.json(
        { error: "Sản phẩm không tồn tại trong giỏ hàng" },
        { status: 404 }
      );
    }
    
    // Delete cart item
    await prisma.cartItem.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing from cart:", error);
    return NextResponse.json(
      { error: "Lỗi khi xóa sản phẩm khỏi giỏ hàng" },
      { status: 500 }
    );
  }
} 