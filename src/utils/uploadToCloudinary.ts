export async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'ecommerce_upload_doovin'); // Thay bằng upload_preset của bạn

  const res = await fetch('https://api.cloudinary.com/v1_1/demsalgkh/image/upload', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Upload to Cloudinary failed');
  const data = await res.json();
  return data.secure_url;
}
// Ghi chú: Thay YOUR_UPLOAD_PRESET bằng upload_preset Cloudinary của bạn. 