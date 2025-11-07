declare module 'html-docx-js/dist/html-docx' {
  interface ExportOptions {
    orientation?: 'landscape' | 'portrait';
    margins?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
  }

  export default class HTMLDocx {
    static asBlob(html: string, options?: ExportOptions): Blob;
  }
}
