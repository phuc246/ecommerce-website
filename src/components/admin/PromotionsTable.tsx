"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { Promotion } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PromotionsTableProps {
  promotions: Promotion[];
  onEdit: (promotion: Promotion) => void;
  onDeleteSuccess: () => void;
}

export default function PromotionsTable({ promotions, onEdit, onDeleteSuccess }: PromotionsTableProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [promotionToDelete, setPromotionToDelete] = useState<Promotion | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!promotionToDelete) return;
    setIsDeleting(true);
    const toastId = toast.loading("Đang xóa...");

    try {
      const response = await fetch(`/api/admin/promotions/${promotionToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Xóa thất bại");
      }

      toast.success("Xóa thành công!", { id: toastId });
      onDeleteSuccess();
    } catch (error) {
      toast.error("Đã có lỗi xảy ra.", { id: toastId });
    } finally {
      setIsDeleting(false);
      setPromotionToDelete(null);
    }
  };

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ảnh</TableHead>
              <TableHead>Mã</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Giá trị</TableHead>
              <TableHead>Hiệu lực</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promotions.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  {p.backgroundImage && (
                    <img
                      src={p.backgroundImage}
                      alt="Ảnh mã giảm giá"
                      className="w-12 h-8 object-cover rounded cursor-pointer border"
                      onClick={() => setPreviewImage(p.backgroundImage)}
                    />
                  )}
                </TableCell>
                <TableCell className="font-medium">{p.code}</TableCell>
                <TableCell>
                  {p.discountType === "PERCENTAGE" ? "Phần trăm" : "Giá cố định"}
                </TableCell>
                <TableCell>
                  {p.discountType === "PERCENTAGE"
                    ? `${p.discountValue}%`
                    : `${p.discountValue.toLocaleString("vi-VN")} VND`}
                </TableCell>
                <TableCell>
                  {format(new Date(p.startDate), "dd/MM/yy")} - {format(new Date(p.endDate), "dd/MM/yy")}
                </TableCell>
                <TableCell>
                  <Badge variant={p.isActive ? "default" : "destructive"}>
                    {p.isActive ? "Kích hoạt" : "Vô hiệu"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Mở menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(p)}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Chỉnh sửa</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPromotionToDelete(p)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Xóa</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!promotionToDelete} onOpenChange={(open) => !open && setPromotionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Mã giảm giá "{promotionToDelete?.code}" sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Đang xóa..." : "Tiếp tục"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-[90vw] max-h-[80vh] rounded shadow-lg border-4 border-white"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
} 