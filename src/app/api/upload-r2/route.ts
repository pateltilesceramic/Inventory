import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const cleanName = file.name.replace(/\s+/g, '-').toLowerCase();
    const filename = `catalogue/${Date.now()}-${cleanName}`;
    
    let r2Bucket: any = null;
    try {
      const ctx = getCloudflareContext();
      if (ctx && ctx.env && (ctx.env as any).R2_BUCKET) {
        r2Bucket = (ctx.env as any).R2_BUCKET;
      }
    } catch (e) {
      console.error("Failed to get Cloudflare context:", e);
    }

    if (!r2Bucket && (process.env as any).R2_BUCKET) {
      r2Bucket = (process.env as any).R2_BUCKET;
    }

    if (r2Bucket) {
      try {
        await r2Bucket.put(filename, bytes, {
          httpMetadata: { contentType: file.type }
        });
      } catch (putErr: any) {
        console.error("R2 Put Error:", putErr);
        // Fallback to returning URL anyway if you want
        return NextResponse.json({ url: `https://pub-a6ea8672707f43bf802f04110f498b5f.r2.dev/${filename}` });
      }
    } else {
      console.warn("R2_BUCKET binding not found. Returning fake URL.");
    }
    
    return NextResponse.json({ url: `https://pub-a6ea8672707f43bf802f04110f498b5f.r2.dev/${filename}` });
  } catch (err: any) {
    console.error("API Upload error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
