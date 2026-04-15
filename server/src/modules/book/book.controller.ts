import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../middleware/errorHandler';
import * as bookService from './book.service';
import type { CreateBookInput, UpdateBookInput, ListBooksInput } from './book.schema';

export const createBook = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Image requise');
  }

  const data = req.body as CreateBookInput;
  const book = await bookService.createBook(req.user!.id, data, req.file.buffer);
  res.status(201).json({ success: true, data: book });
});

export const updateBook = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as UpdateBookInput;
  const book = await bookService.updateBook(
    req.user!.id,
    req.params.id as string,
    data,
    req.file?.buffer
  );
  res.json({ success: true, data: book });
});

export const deleteBook = asyncHandler(async (req: Request, res: Response) => {
  await bookService.deleteBook(req.user!.id, req.user!.role, req.params.id as string);
  res.json({ success: true, data: { message: 'Livre supprime avec succes' } });
});

export const getBookById = asyncHandler(async (req: Request, res: Response) => {
  const book = await bookService.getBookById(req.params.id as string, req.user!.id);
  res.json({ success: true, data: book });
});

export const listBooks = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListBooksInput;
  const result = await bookService.listBooks(query, req.user!.id);
  res.json({ success: true, data: result.books, meta: result.meta });
});

export const getMyBooks = asyncHandler(async (req: Request, res: Response) => {
  const books = await bookService.getMyBooks(req.user!.id);
  res.json({ success: true, data: books });
});
