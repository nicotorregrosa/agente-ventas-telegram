CREATE TABLE productos (
  id SERIAL PRIMARY KEY,
  tipo_prenda TEXT,
  talla TEXT,
  color TEXT,
  cantidad_disponible INTEGER,
  precio_50_u NUMERIC,
  precio_100_u NUMERIC,
  precio_200_u NUMERIC,
  disponible BOOLEAN,
  categoria TEXT,
  descripcion TEXT
);
