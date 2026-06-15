const MAX_EBOOK_BYTES = 5 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/epub+zip': '.epub',
  'application/x-fictionbook+xml': '.fb2',
  'text/plain': '.txt',
  'application/x-mobipocket-ebook': '.mobi',
};

export const sanitizeFileName = (name: string): string =>
  name.replace(/[<>:"/\\|?*]/g, '_').trim();

export const getExtensionFromDataUrl = (dataUrl: string): string | null => {
  const match = dataUrl.match(/^data:([^;,]+)/);
  if (!match) return null;
  return MIME_TO_EXT[match[1].toLowerCase()] ?? null;
};

export interface ElectronicDownloadMeta {
  title: string;
  electronicFileName?: string;
  electronicData?: string;
}

/** Имя файла при скачивании электронной книги (с расширением) */
export const getElectronicDownloadFileName = (book: ElectronicDownloadMeta): string => {
  if (book.electronicFileName) {
    return sanitizeFileName(book.electronicFileName);
  }

  const base = sanitizeFileName(book.title);
  const ext = book.electronicData ? getExtensionFromDataUrl(book.electronicData) : null;

  if (ext && !base.toLowerCase().endsWith(ext.toLowerCase())) {
    return `${base}${ext}`;
  }

  return base;
};

/** Читает файл как Data URL (base64-строка) для записи в RTDB */
export const fileToDataUrl = (file: File): Promise<string> => {
  if (file.size > MAX_EBOOK_BYTES) {
    return Promise.reject(new Error('FILE_TOO_LARGE'));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('READ_FAILED'));
    reader.readAsDataURL(file);
  });
};

export const EBOOK_MAX_SIZE_MB = MAX_EBOOK_BYTES / (1024 * 1024);

export const EBOOK_MAX_SIZE_LABEL = `${EBOOK_MAX_SIZE_MB} МБ`;
