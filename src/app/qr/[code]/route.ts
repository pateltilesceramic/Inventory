import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const cleanCode = code?.toLowerCase()?.trim()

    if (!cleanCode) {
      return new NextResponse("Invalid QR Code", { status: 400 })
    }

    const qr = await prisma.dynamicQR.findUnique({
      where: { code: cleanCode }
    })

    if (!qr || !qr.isActive) {
      // Return a clean, branded HTML response explaining the status
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>QR Code Notice | Patel Tiles Ceramic</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                background: #f4f6f8;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                color: #111;
              }
              .card {
                background: white;
                padding: 40px;
                border-radius: 16px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.08);
                max-width: 440px;
                width: 90%;
                text-align: center;
                border-top: 6px solid #1F6F5F;
              }
              .logo {
                width: 64px;
                height: 64px;
                margin: 0 auto 20px auto;
                background: #e8f3f1;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #1F6F5F;
                font-weight: bold;
                font-size: 28px;
              }
              h1 {
                font-size: 22px;
                margin-bottom: 12px;
                color: #111;
              }
              p {
                font-size: 15px;
                color: #666;
                line-height: 1.6;
                margin-bottom: 24px;
              }
              .btn {
                display: inline-block;
                background: #1F6F5F;
                color: white;
                text-decoration: none;
                padding: 12px 28px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 14px;
                transition: background 0.2s;
              }
              .btn:hover {
                background: #18584B;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="logo">P</div>
              <h1>${qr ? "QR Link Currently Paused" : "QR Link Not Found"}</h1>
              <p>
                ${
                  qr
                    ? `The link for <b>${qr.title}</b> is currently paused or undergoing maintenance by Patel Tiles Ceramic.`
                    : `The scanned QR link (<b>${cleanCode}</b>) is not recognized or has been removed.`
                }
                Please contact our showroom or visit our home page for the latest updates and catalogues.
              </p>
              <a href="/" class="btn">Go to Patel Tiles Showroom</a>
            </div>
          </body>
        </html>
      `
      return new NextResponse(htmlContent, {
        status: qr ? 503 : 404,
        headers: { "Content-Type": "text/html" }
      })
    }

    // Increment scan counter asynchronously
    await prisma.dynamicQR.update({
      where: { id: qr.id },
      data: { scans: { increment: 1 } }
    })

    // Redirect to destination URL
    return NextResponse.redirect(qr.targetUrl, { status: 307 })
  } catch (error) {
    console.error("QR Redirect Error:", error)
    return new NextResponse("Server Error during QR Redirect", { status: 500 })
  }
}
