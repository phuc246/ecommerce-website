import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const runtime = 'nodejs';

// Define allowed destinations for security
const ALLOWED_DESTINATIONS = ['logo', 'category', 'product', 'promotion', 'trends', 'temp', 'video', 'videobg', 'videos'];

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData (file upload)
      const formData = await req.formData();
      const file = formData.get('file');
      const destination = formData.get('destination')?.toString() || 'temp';

      if (!ALLOWED_DESTINATIONS.includes(destination)) {
        return new Response(JSON.stringify({ error: 'Invalid destination' }), { status: 400 });
      }

      if (!file || !(file instanceof File)) {
        return new Response(JSON.stringify({ error: 'No file uploaded' }), { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const isVideo = file.type?.startsWith('video/');
      // Upload lên Cloudinary
      const uploadRes = await new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: destination, resource_type: isVideo ? 'video' : 'image' },
          (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
            if (error || !result) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });
      // @ts-ignore
      return new Response(JSON.stringify({ url: uploadRes.secure_url }), { status: 200 });

    } else if (contentType.includes('application/json')) {
      // Handle JSON (base64 string)
      const body = await req.json();
      const base64 = body.file;
      const destination = body.destination || 'temp';

      if (!base64 || typeof base64 !== 'string') {
        return new Response(JSON.stringify({ error: 'Invalid base64 data' }), { status: 400 });
      }
      if (!ALLOWED_DESTINATIONS.includes(destination)) {
        return new Response(JSON.stringify({ error: 'Invalid destination' }), { status: 400 });
      }

      const buffer = Buffer.from(base64.split(',')[1], 'base64');
      const mime = base64.split(';')[0].split(':')[1];
      const isVideo = mime?.startsWith('video/');
      const fileName = `${Date.now()}.${mime?.split('/')[1] || 'unknown'}`;
      
      // Upload lên Cloudinary
      const uploadRes = await new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: destination, resource_type: isVideo ? 'video' : 'image' },
          (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
            if (error || !result) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });
      // @ts-ignore
      return new Response(JSON.stringify({ url: uploadRes.secure_url }), { status: 200 });
    } else {
      return new Response(JSON.stringify({ error: 'Unsupported Content-Type' }), { status: 415 });
    }
  } catch (error) {
    console.error('Upload Error:', error);
    const err = error as any;
    return new Response(JSON.stringify({ error: err?.message || err?.toString() || 'Internal Server Error' }), { status: 500 });
  }
}

// Hướng dẫn: Thêm các biến môi trường sau vào .env.local
// CLOUDINARY_CLOUD_NAME=your_cloud_name
// CLOUDINARY_API_KEY=your_api_key
// CLOUDINARY_API_SECRET=your_api_secret
// Nếu chưa cài cloudinary: npm install cloudinary 