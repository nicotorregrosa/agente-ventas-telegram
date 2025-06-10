# 🤖 Agente de Ventas B2B - Telegram Bot + PostgreSQL

Este proyecto es un agente de ventas tipo B2B implementado como bot de Telegram. Permite a los usuarios realizar, modificar y eliminar pedidos, además de consultar productos y stock, todo integrado con una base de datos PostgreSQL desplegada en Render.

---

## 🚀 Funcionalidades principales

- Crear pedidos personalizados.
- Modificar un pedido dentro de los 5 minutos de su creación.
- Eliminar pedidos.
- Ver todos los pedidos realizados.
- Consultar stock disponible por prenda, color y talla.
- Ver todos los productos de un tipo de prenda.

---

## 🛠️ Tecnologías utilizadas

- Node.js
- Telegram Bot API (`node-telegram-bot-api`)
- PostgreSQL (base de datos en Render)
- Express.js (para el backend / API REST)
- Axios (para solicitudes HTTP internas entre bot y backend)
- Render (para despliegue de backend y base de datos)

---

## 📁 Estructura del proyecto

```
├── bot.js           # Lógica del bot de Telegram
├── db.js            # Conexión a PostgreSQL
├── index.js         # Servidor Express.js con endpoints REST
├── package.json     # Dependencias y scripts
├── .env             # Variables de entorno
├── .gitignore       # Ignora node_modules y .env
└── textil_db.sql    # Script para crear e insertar datos en la BD
```

---

## 🧪 Endpoints disponibles

Estos son manejados desde `index.js`:

### 📋 Pedidos

- `GET /pedidos` → Lista todos los pedidos.
- `GET /pedidos/:id` → Busca pedido por ID.
- `POST /pedidos` → Crea un pedido nuevo.
- `PUT /editar-pedido/:id` → Modifica pedido existente.
- `DELETE /pedidos/:id` → Elimina pedido por ID.

### 👕 Productos

- `GET /productos/filtrar?tipo_prenda=...` → Filtra productos por prenda.
- `POST /productos/search` → Busca productos por tipo, talla y color.

### 📦 Stock

- `GET /stock?tipo_prenda=...&talla=...&color=...` → Consulta stock disponible.

---

## ⚙️ Instalación local

1. Cloná el repositorio:

```bash
git clone https://github.com/tu_usuario/tu_repositorio.git
cd tu_repositorio
```

2. Instalá las dependencias (Con node.js instalado previamente):

```bash
npm install
```

3. Creá un archivo `.env` y completalo con tus credenciales:

```env
DB_USER=nicolas
DB_PASSWORD=puZv6FldIHuXYt6PD7Uqu6m2qxdV9QJb
DB_HOST=dpg-d13g05c9c44c739a6250-a.oregon-postgres.render.com
DB_PORT=5432
DB_NAME=prendasdb
PORT=3000
```

> 💡 Podés usar estas mismas credenciales para conectar con la base de datos en Render (si sigue activa).

4. Iniciá el servidor local (opcional si usás el backend desplegado):

```bash
node index.js
```

5. Iniciá el bot localmente (si querés testear sin Render):

```bash
node bot.js
```

> 📌 **Importante:** Para que el agente funcione en local se tiene que apuntar a `http://localhost:3000/...` en lugar de Render.

---

## ☁️ Despliegue en Render

Se desplegaron 3 servicios:

- Backend/API REST.
- Base de datos PostgreSQL(creada vía Render Dashboard).
- Bot de Telegram como Background Worker: corre `bot.js` en Render y permanece activo.

> 📌 **Importante:** El bot está diseñado para ejecutarse como Background Worker (no necesita puerto).

---

## 🤖 Cómo usar el bot

1. Ingresá a este link: https://t.me/Ventas_Textil_bot
2. Presioná "Start" o enviá `/start`
3. Interactuá con el menú para:
   - Crear un pedido
   - Modificar uno existente (solo en los primeros 5 min)
   - Eliminar pedidos
   - Consultar stock o productos disponibles

> 📌 **Importante:** El bot puede llegar a tardar en responder debido a demoras en Render, si no hay respuesta, esperá unos minutos.

---

## 📸 Video explicativo

- https://youtu.be/dE3XrogIkHg

---

## 📌 Acceso a drive con la parte teórica del desafío

- https://drive.google.com/drive/folders/1A4Nn4Vb974uz0UWrFP_Xxqq-m9Ni3RO3?usp=drive_link

---

## 📌 Créditos

Desarrollado por **Nicolás Torregrosa** como parte de un challenge técnico de agente de ventas B2B con Telegram + PostgreSQL.
