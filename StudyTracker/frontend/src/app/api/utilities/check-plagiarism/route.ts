// app/api/tools/check-plagiarism/route.ts
// TODO: This code has fatal bugs
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { existsSync } from 'fs';

// Ensure uploads directory exists
const uploadDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadDir)) {
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (err) {
    console.error('Error creating uploads directory:', err);
  }
}

// Utility functions
async function saveFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filePath = join(uploadDir, file.name);
  await writeFile(filePath, buffer);
  return filePath;
}

async function readDocx(filePath: string): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    console.error('Error reading DOCX:', error);
    throw new Error('Failed to read DOCX file');
  }
}

async function readPdf(filePath: string): Promise<string> {
  try {
    const dataBuffer = await require('fs').readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Error reading PDF:', error);
    throw new Error('Failed to read PDF file');
  }
}

async function readDocument(filePath: string): Promise<string> {
  if (filePath.toLowerCase().endsWith('.docx')) {
    return await readDocx(filePath);
  } else if (filePath.toLowerCase().endsWith('.pdf')) {
    return await readPdf(filePath);
  }
  throw new Error('Unsupported file format');
}

function getShingles(doc: string, shingleSizes = [5, 7, 9]): string[] {
  const words = doc.split(/\s+/).filter(word => word.length > 0);
  const shingles = [];
  
  for (const size of shingleSizes) {
    for (let i = 0; i <= words.length - size; i++) {
      shingles.push(words.slice(i, i + size).join(' '));
    }
  }
  
  return shingles;
}

function hashShingle(shingle: string): string {
  return crypto.createHash('sha256').update(shingle).digest('hex');
}

function getHashedShingles(doc: string, shingleSizes = [5, 7, 9]): Set<string> {
  const shingles = getShingles(doc, shingleSizes);
  return new Set(shingles.map(hashShingle));
}

function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return union.size ? intersection.size / union.size : 0;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('docs') as File[];

    if (!files || files.length < 2) {
      return NextResponse.json(
        { error: 'Please upload at least 2 files' },
        { status: 400 }
      );
    }

    const docsHashedShingles: { [key: string]: Set<string> } = {};
    const savedPaths: string[] = [];

    // Save and process each file
    for (const file of files) {
      const filePath = await saveFile(file);
      savedPaths.push(filePath);
      
      const content = await readDocument(filePath);
      docsHashedShingles[file.name] = getHashedShingles(content);
    }

    // Calculate similarities
    const results = [];
    const fileNames = Object.keys(docsHashedShingles);
    
    for (let i = 0; i < fileNames.length; i++) {
      for (let j = i + 1; j < fileNames.length; j++) {
        const similarity = jaccardSimilarity(
          docsHashedShingles[fileNames[i]],
          docsHashedShingles[fileNames[j]]
        );
        
        results.push({
          file1: fileNames[i],
          file2: fileNames[j],
          similarity: similarity * 100
        });
      }
    }

    // Cleanup saved files
    for (const path of savedPaths) {
      await unlink(path).catch(console.error);
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error processing files:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error processing files' },
      { status: 500 }
    );
  }
}