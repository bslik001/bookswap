-- Full-text search vector on books table (title + author, French language)
ALTER TABLE books ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('french', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(author, '')), 'B')
  ) STORED;

CREATE INDEX idx_books_search ON books USING GIN (search_vector);
