-- Prijs per fles in euro's, en of die door Claude is opgezocht (geschat)
ALTER TABLE wines ADD COLUMN price REAL;
ALTER TABLE wines ADD COLUMN price_estimated INTEGER NOT NULL DEFAULT 0;
