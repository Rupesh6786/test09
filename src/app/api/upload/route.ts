
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, message: 'No file uploaded.' }, { status: 400 });
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Use a unique filename to avoid overwrites
    const uniqueFilename = `${uuidv4()}-${file.name.replace(/\s+/g, '_')}`;
    const uploadDir = path.join(process.cwd(), 'public', 'profile_img');
    const filePath = path.join(uploadDir, uniqueFilename);

    // Ensure the upload directory exists
    await mkdir(uploadDir, { recursive: true });
    // Write the file to the public directory
    await writeFile(filePath, buffer);
    
    const publicPath = `/profile_img/${uniqueFilename}`;

    return NextResponse.json({ success: true, path: publicPath });
  } catch (error) {
    console.error('Error saving file:', error);
    return NextResponse.json({ success: false, message: 'Error saving file.' }, { status: 500 });
  }
}
