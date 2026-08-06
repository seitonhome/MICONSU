-- Límite de tamaño por archivo a nivel de bucket, como segunda barrera además
-- de la validación en el servidor (lib/storage/limits.ts). Sin esto, un cliente
-- que llame directo a la API de Storage podría saltarse el límite de la app.
update storage.buckets set file_size_limit = 5242880 where id = 'branding'; -- 5 MB
update storage.buckets set file_size_limit = 26214400 where id = 'clinical-documents'; -- 25 MB
