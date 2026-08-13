export const MAX_FILE_SIZE = 15 * 1024 * 1024;

export const ACCEPTED_FILES: Record<string, { label: string; extensions: string[]; signature: 'pdf' | 'docx' | 'pptx' }> = {
  'application/pdf': { label: 'PDF', extensions: ['.pdf'], signature: 'pdf' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { label: 'Word', extensions: ['.docx'], signature: 'docx' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { label: 'PowerPoint', extensions: ['.pptx'], signature: 'pptx' },
};

function hasOfficeStructure(bytes: Uint8Array, signature: 'docx' | 'pptx') {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const minimumEndRecordSize = 22;
  const maximumCommentSize = 0xffff;
  const searchStart = Math.max(0, bytes.length - minimumEndRecordSize - maximumCommentSize);
  let endRecord = -1;
  for (let offset = bytes.length - minimumEndRecordSize; offset >= searchStart; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      endRecord = offset;
      break;
    }
  }
  if (endRecord < 0) return false;

  const entryCount = view.getUint16(endRecord + 10, true);
  const centralDirectorySize = view.getUint32(endRecord + 12, true);
  const centralDirectoryOffset = view.getUint32(endRecord + 16, true);
  if (centralDirectoryOffset + centralDirectorySize > bytes.length) return false;

  let offset = centralDirectoryOffset;
  const names = new Set<string>();
  for (let entry = 0; entry < entryCount; entry += 1) {
    if (offset + 46 > bytes.length || view.getUint32(offset, true) !== 0x02014b50) return false;
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const nameStart = offset + 46;
    const nameEnd = nameStart + nameLength;
    if (nameEnd > bytes.length) return false;
    names.add(new TextDecoder().decode(bytes.slice(nameStart, nameEnd)));
    offset = nameEnd + extraLength + commentLength;
  }

  return names.has('[Content_Types].xml') && names.has(signature === 'docx' ? 'word/document.xml' : 'ppt/presentation.xml');
}

function hasSignature(bytes: Uint8Array, signature: 'pdf' | 'docx' | 'pptx') {
  if (signature === 'pdf') return bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-';
  return hasOfficeStructure(bytes, signature);
}

export async function validateUploadedFile(file: File): Promise<string | null> {
  const accepted = ACCEPTED_FILES[file.type];
  if (!accepted) return 'Only PDF, DOCX, and PPTX files are accepted.';
  if (file.size === 0 || file.size > MAX_FILE_SIZE) return 'File must be between 1 byte and 15 MB.';
  const lowerName = file.name.toLowerCase();
  if (!accepted.extensions.some((extension) => lowerName.endsWith(extension))) return 'The file extension does not match its declared type.';
  const bytes = new Uint8Array(await file.arrayBuffer());
  return hasSignature(bytes, accepted.signature) ? null : 'The file contents do not match its declared type.';
}

// Timetable uploads (photo of a printed/whiteboard timetable, or a PDF
// export) — a separate, narrower whitelist from the general resource
// uploader above, since timetables are the one resource type meant to be
// read by an AI vision model rather than downloaded as a document.
export const ACCEPTED_TIMETABLE_FILES: Record<string, { label: string; extensions: string[] }> = {
  'application/pdf': { label: 'PDF', extensions: ['.pdf'] },
  'image/jpeg': { label: 'JPEG', extensions: ['.jpg', '.jpeg'] },
  'image/png': { label: 'PNG', extensions: ['.png'] },
  'image/webp': { label: 'WebP', extensions: ['.webp'] },
};

function hasImageSignature(bytes: Uint8Array, mimeType: string): boolean {
  if (mimeType === 'image/jpeg') return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === 'image/png') {
    const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return bytes.length >= png.length && png.every((byte, index) => bytes[index] === byte);
  }
  if (mimeType === 'image/webp') {
    return (
      bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
    );
  }
  return false;
}

export async function validateTimetableFile(file: File): Promise<string | null> {
  const accepted = ACCEPTED_TIMETABLE_FILES[file.type];
  if (!accepted) return 'Only PDF, JPEG, PNG, or WebP files are accepted.';
  if (file.size === 0 || file.size > MAX_FILE_SIZE) return 'File must be between 1 byte and 15 MB.';
  const lowerName = file.name.toLowerCase();
  if (!accepted.extensions.some((extension) => lowerName.endsWith(extension))) return 'The file extension does not match its declared type.';
  const bytes = new Uint8Array(await file.arrayBuffer());
  const valid = file.type === 'application/pdf' ? hasSignature(bytes, 'pdf') : hasImageSignature(bytes, file.type);
  return valid ? null : 'The file contents do not match its declared type.';
}
