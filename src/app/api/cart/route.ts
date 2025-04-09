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

  if (!cartId) {
    cartId = uuidv4();
    cookieStore.set("cartId", cartId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
  }

  let cart = await prisma.cart.findFirst({
    where: { id: cartId },
    include: { items: true },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { id: cartId },
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
    
    // Fetch detailed cart items with product, color, and size information
    const cartItems = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
          },
        },
        color: {
          select: {
            id: true,
            name: true,
            value: true,
          },
        },
        size: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    // Calculate totals
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    
    return NextResponse.json({
      items: cartItems,
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
    
    const body = await request.json();
    const { productId, colorId, sizeId, quantity } = body;
    
    // Validate request
    if (!productId || !colorId || !sizeId || !quantity) {
      return NextResponse.json(
        { error: "Thiếu thông tin sản phẩm" },
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
    
    // Check if color exists
    const color = await prisma.color.findFirst({
      where: { id: colorId, productId },
    });
    
    if (!color) {
      return NextResponse.json(
        { error: "Màu sắc không hợp lệ" },
        { status: 400 }
      );
    }
    
    // Check if size exists
    const size = await prisma.size.findFirst({
      where: { id: sizeId, productId },
    });
    
    if (!size) {
      return NextResponse.json(
        { error: "Kích thước không hợp lệ" },
        { status: 400 }
      );
    }
    
    // Get or create cart
    const cart = await getOrCreateCart(userId);
    
    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        colorId,
        sizeId,
      },
    });
    
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
          productId,
          colorId,
          sizeId,
          quantity,
        },
      });
    }
    
    return NextResponse.json({ success: true });
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