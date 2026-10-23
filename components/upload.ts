import type { ApiError } from '@/lib/types';

export class UploadError extends Error {
  constructor(readonly payload: ApiError) {
    super(payload.error);
  }
}

/** XHR-based upload so we can report real byte-level progress. */
export function uploadWithProgress<T>(
  url: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.responseType = 'text';
    xhr.timeout = 5 * 60 * 1000;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(xhr.responseText);
      } catch {
        reject(new UploadError({ error: `Server returned a non-JSON response (${xhr.status}).`, code: 'server_error' }));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(parsed as T);
      } else {
        reject(new UploadError(parsed as ApiError));
      }
    };

    xhr.onerror = () =>
      reject(new UploadError({ error: 'Network error while uploading. Check your connection and try again.', code: 'server_error' }));
    xhr.ontimeout = () =>
      reject(new UploadError({ error: 'Upload timed out. Try a smaller or shorter file.', code: 'timeout' }));

    xhr.send(form);
  });
}
