# Trabajo Comuna

La app ahora guarda las asistencias en Cloudinary mediante una API Node.

## Configuracion

1. Copia `.env.example` a `.env`.
2. Completa tus credenciales de Cloudinary en `.env`:

```env
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
CLOUDINARY_DB_PUBLIC_ID=comuna_asistencias_db
ADMIN_USER=FloridaLuisiana
ADMIN_PASSWORD=Comuna2026*
API_PORT=4000
```

3. Si desplegas el frontend en Netlify y la API en otro servicio, define en Netlify:

```env
REACT_APP_API_BASE_URL=https://tu-api-publica.com
```

Si no se define, el frontend usa rutas relativas (`/api/...`) en el mismo dominio.

## Scripts

- `npm run dev`: levanta frontend (puerto 3000) + API (puerto 4000)
- `npm start`: levanta solo frontend
- `npm run api`: levanta solo API
- `npm run build`: build de produccion frontend

## Flujo de datos

- El formulario de confirmacion envia asistencias a `POST /api/asistencias`.
- El panel `/administracion` usa:
	- `POST /api/admin/login`
	- `GET /api/asistencias`
	- `POST /api/asistencias`
	- `PUT /api/asistencias/:id`
	- `DELETE /api/asistencias/:id`

La base de datos se guarda como JSON en Cloudinary (recurso `raw`), usando `CLOUDINARY_DB_PUBLIC_ID`.
