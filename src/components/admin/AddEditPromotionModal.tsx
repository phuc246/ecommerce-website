"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-hot-toast";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import ImageCropper from "@/components/ImageCropper";

const promotionSchema = z.object({
  code: z.string().min(1, "Mã giảm giá là bắt buộc"),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  discountValue: z.coerce.number().min(0, "Giá trị phải lớn hơn 0"),
  startDate: z.date({ required_error: "Ngày bắt đầu là bắt buộc" }),
  endDate: z.date({ required_error: "Ngày kết thúc là bắt buộc" }),
  isActive: z.boolean(),
  usageLimit: z.coerce.number().optional().nullable(),
  title: z.string().optional(),
  description: z.string().optional(),
  backgroundImage: z.string().optional(),
}).refine(data => data.endDate >= data.startDate, {
  message: "Ngày kết thúc phải sau ngày bắt đầu",
  path: ["endDate"],
});

type PromotionFormValues = z.infer<typeof promotionSchema>;

interface AddEditPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  promotion: PromotionFormValues & { id?: string } | null;
}

export default function AddEditPromotionModal({ isOpen, onClose, onSuccess, promotion }: AddEditPromotionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!promotion?.id;
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>("");
  const [discountValueRaw, setDiscountValueRaw] = useState("");
  const [showCropper, setShowCropper] = useState(false);
  const [rawImage, setRawImage] = useState<string>("");
  const [croppedImage, setCroppedImage] = useState<string>("");

  const form = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionSchema),
  });

  useEffect(() => {
    if (promotion) {
      form.reset({
        ...promotion,
        isActive: promotion.isActive ?? true,
        startDate: new Date(promotion.startDate),
        endDate: new Date(promotion.endDate),
        usageLimit: promotion.usageLimit ?? null,
        title: promotion.title || "",
        description: promotion.description || "",
        backgroundImage: promotion.backgroundImage || "",
        discountType: promotion.discountType as "PERCENTAGE" | "FIXED_AMOUNT",
      });
    } else {
      form.reset({
        code: "",
        discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED_AMOUNT",
        discountValue: 0,
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        isActive: true,
        usageLimit: null,
        title: "",
        description: "",
        backgroundImage: "",
      });
    }
  }, [promotion, form]);

  useEffect(() => {
    if (form.watch("discountType") === "FIXED_AMOUNT") {
      const value = promotion?.discountValue ?? 0;
      setDiscountValueRaw(String(value));
      form.setValue("discountValue", Number(value));
    }
  }, [promotion, form, form.watch("discountType")]);

  const onSubmit = async (data: PromotionFormValues) => {
    setIsSubmitting(true);
    const toastId = toast.loading(isEditMode ? "Đang cập nhật..." : "Đang tạo...");

    try {
      const url = isEditMode ? `/api/admin/promotions/${promotion.id}` : "/api/admin/promotions";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          usageLimit: data.usageLimit || null,
          title: data.title || '',
          description: data.description || '',
          backgroundImage: data.backgroundImage || '',
        }),
      });

      if (!response.ok) {
        throw new Error("Đã có lỗi xảy ra");
      }
      
      toast.success(isEditMode ? "Cập nhật thành công!" : "Tạo thành công!", { id: toastId });
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Đã có lỗi xảy ra. Vui lòng thử lại.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRawImage(ev.target?.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropDone = async (cropped: string) => {
    setShowCropper(false);
    setCroppedImage(cropped);
    setUploading(true);
    try {
      // Convert base64 to blob
      const res = await fetch(cropped);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append("file", new File([blob], "cropped.png", { type: blob.type }));
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await uploadRes.json();
      if (data.url) {
        form.setValue("backgroundImage", data.url);
        setPreview(data.url);
      }
    } catch (err) {
      toast.error("Lỗi upload ảnh banner");
    } finally {
      setUploading(false);
    }
  };

  const handleBannerUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue("backgroundImage", e.target.value);
    setPreview(e.target.value);
  };

  const handleDiscountValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, "");
    setDiscountValueRaw(raw);
    form.setValue("discountValue", Number(raw));
  };

  function formatCurrencyInput(value: string | number) {
    const numeric = String(value ?? '').replace(/\D/g, "");
    return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Chỉnh sửa mã giảm giá" : "Tạo mã giảm giá mới"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="code" className="text-right">Mã</Label>
            <Input id="code" {...form.register("code")} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="discountType" className="text-right">Loại</Label>
            <Select onValueChange={(value) => form.setValue("discountType", value as any)} defaultValue={form.getValues("discountType")}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Chọn loại giảm giá" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENTAGE">Phần trăm (%)</SelectItem>
                <SelectItem value="FIXED_AMOUNT">Số tiền cố định (VND)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="discountValue" className="text-right">Giá trị</Label>
            {form.watch("discountType") === "FIXED_AMOUNT" ? (
              <Input
                id="discountValue"
                inputMode="numeric"
                value={formatCurrencyInput(discountValueRaw)}
                onChange={handleDiscountValueChange}
                className="col-span-3"
                placeholder="0"
                autoComplete="off"
                maxLength={11}
              />
            ) : (
              <Input
                id="discountValue"
                type="number"
                {...form.register("discountValue")}
                className="col-span-3"
                placeholder="0"
                autoComplete="off"
              />
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Ngày bắt đầu</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("col-span-3 justify-start text-left font-normal", !form.watch("startDate") && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch("startDate") ? format(form.watch("startDate"), "PPP") : <span>Chọn ngày</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={form.watch("startDate")} onSelect={(date) => form.setValue("startDate", date as Date)} initialFocus locale={vi} />
              </PopoverContent>
            </Popover>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Ngày kết thúc</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("col-span-3 justify-start text-left font-normal", !form.watch("endDate") && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch("endDate") ? format(form.watch("endDate"), "PPP") : <span>Chọn ngày</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={form.watch("endDate")} onSelect={(date) => form.setValue("endDate", date as Date)} initialFocus locale={vi} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="usageLimit" className="text-right">Giới hạn lượt</Label>
            <Input id="usageLimit" type="number" {...form.register("usageLimit")} className="col-span-3" placeholder="Để trống nếu không giới hạn"/>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="isActive" className="text-right">Kích hoạt</Label>
            <div className="col-span-3">
              <Checkbox id="isActive" checked={form.watch("isActive")} onCheckedChange={(checked) => form.setValue("isActive", !!checked)} />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Tiêu đề banner</Label>
            <Input id="title" {...form.register("title")} className="col-span-3" placeholder="Ví dụ: Khuyến mãi mùa hè" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Mô tả ngắn</Label>
            <Input id="description" {...form.register("description")} className="col-span-3" placeholder="Ví dụ: Giảm giá 20% cho tất cả sản phẩm" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">{isEditMode ? "Cập nhật ảnh" : "Tải ảnh"}</Label>
            <div className="col-span-3 flex items-center gap-2">
              {preview && (
                <img src={preview} alt="preview" className="w-16 h-12 object-cover rounded shadow" loading="eager" width="64" height="48" />
              )}
              <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? "Đang tải..." : "Tải ảnh"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBannerFileChange}
                disabled={uploading}
                title="Chọn ảnh banner (tỉ lệ 16:9, JPG, PNG, WEBP)"
                placeholder="Chọn ảnh banner"
              />
            </div>
          </div>
          {showCropper && rawImage && (
            <ImageCropper
              image={rawImage}
              onCropDone={cropped => handleCropDone(cropped)}
              onCancel={() => setShowCropper(false)}
              aspectRatioOptions={[{ value: "1.7777778", label: "16:9" }]}
            />
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Debug</Label>
            <div className="col-span-3 flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => { setRawImage("/logo/logo-1743957321469.png"); setShowCropper(true); }}>
                Test Cropper
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 