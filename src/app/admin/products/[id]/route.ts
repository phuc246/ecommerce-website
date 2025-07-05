export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Xoá hết variants, attributes, trends trước khi xoá product
    await prisma.productVariant.deleteMany({ where: { productId: params.id } });
    await prisma.productAttribute.deleteMany({ where: { productId: params.id } });
    await prisma.productTrend.deleteMany({ where: { productId: params.id } });
    await prisma.product.delete({ where: { id: params.id } });
    revalidatePath('/admin/products');
    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 