import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Address {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  ward: string;
}

interface AddressFormProps {
  onClose: () => void;
  onSave?: (address: Address) => void;
  initial?: Address;
}

export default function AddressForm({ onClose, onSave, initial }: AddressFormProps) {
  const [form, setForm] = useState<Address>(
    initial || { fullName: "", phone: "", address: "", city: "", district: "", ward: "" }
  );
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (onSave) onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-4">Cập nhật địa chỉ</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Họ và tên"
              required
              autoFocus
            />
            <Input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Số điện thoại"
              required
            />
            <Input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Địa chỉ cụ thể"
              required
            />
            <Input
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="Tỉnh/Thành phố"
              required
            />
            <Input
              name="district"
              value={form.district}
              onChange={handleChange}
              placeholder="Quận/Huyện"
              required
            />
            <Input
              name="ward"
              value={form.ward}
              onChange={handleChange}
              placeholder="Phường/Xã"
              required
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                Đóng
              </Button>
              <Button type="submit" variant="default" disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 