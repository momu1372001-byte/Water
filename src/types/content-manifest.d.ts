declare module 'virtual:content-manifest' {
  export interface ContentFileEntry {
    path: string;
    data: unknown;
  }
  export const lessonFiles: ContentFileEntry[];
  export const unitFiles: ContentFileEntry[];
}
