import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import ProductForm from "./ProductForm";

interface EditProductModalProps {
  open: boolean;
  onClose: () => void;
  product: any;
  onSave: (data: any) => void;
  categories: any[];
  attributes: any[];
  loading?: boolean;
}

export default function EditProductModal({ open, onClose, product, onSave, categories, attributes, loading }: EditProductModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <DialogTitle>Chỉnh sửa sản phẩm</DialogTitle>
        <ProductForm
          mode="edit"
          initialData={product}
          onSubmit={onSave}
          categories={categories}
          attributes={attributes}
          loading={loading}
        />
      </DialogContent>
    </Dialog>
  );
} 