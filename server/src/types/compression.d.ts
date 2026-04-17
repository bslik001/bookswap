declare module 'compression' {
  import { RequestHandler } from 'express';

  interface CompressionOptions {
    threshold?: number | string;
    level?: number;
    memLevel?: number;
    chunkSize?: number;
    windowBits?: number;
    strategy?: number;
    filter?: (req: unknown, res: unknown) => boolean;
  }

  function compression(options?: CompressionOptions): RequestHandler;
  export = compression;
}
