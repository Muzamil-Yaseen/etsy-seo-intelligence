import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import JSZip from "jszip";

function addDirectoryToZip(zip: JSZip, localPath: string, zipPath = "") {
  const items = fs.readdirSync(localPath);
  for (const item of items) {
    const itemLocal = path.join(localPath, item);
    const itemZip = zipPath ? `${zipPath}/${item}` : item;
    const stat = fs.statSync(itemLocal);
    if (stat.isDirectory()) {
      addDirectoryToZip(zip, itemLocal, itemZip);
    } else {
      const fileData = fs.readFileSync(itemLocal);
      zip.file(itemZip, fileData);
    }
  }
}

export async function GET() {
  try {
    const zip = new JSZip();
    const extDir = path.join(process.cwd(), "extension");
    if (!fs.existsSync(extDir)) {
      return NextResponse.json({ error: "Extension directory not found" }, { status: 404 });
    }

    addDirectoryToZip(zip, extDir);

    const buffer = await zip.generateAsync({ type: "nodebuffer" });

    return new Response(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="etsy-intelligence-extension.zip"',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
