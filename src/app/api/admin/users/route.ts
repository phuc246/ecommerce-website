import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { OrderStatus, Role } from "@prisma/client";

// This type should match the `select` statement in the Prisma query
type UserForAdmin = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  addresses: { phone: string }[];
  orders: { total: number }[];
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        addresses: {
          where: { isDefault: true },
          select: { phone: true }
        },
        orders: {
          where: { status: OrderStatus.DELIVERED },
          select: { total: true }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const usersWithTotalSpent = users.map((user: UserForAdmin) => {
      const totalSpent = user.orders.reduce((acc, order) => acc + order.total, 0);
      const phone = user.addresses[0]?.phone || null;
      // Exclude orders and addresses from the final object
      const { orders, addresses, ...userWithoutExtras } = user;
      return {
        ...userWithoutExtras,
        phone,
        totalSpent,
      };
    });

    return NextResponse.json(usersWithTotalSpent);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { id, name, email, role } = body;

    if (!id) {
      return new NextResponse("User ID is required", { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        role,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[ADMIN_USERS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("User ID is required", { status: 400 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[ADMIN_USERS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 