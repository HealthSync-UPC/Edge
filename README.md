# Edge API

Proyecto Edge API (Node.js + TypeScript + Express + TypeORM + SQLite).

Instalación y uso

- Instalar dependencias:
```powershell
npm install
```

- Copiar `.env.example` a `.env` y configurar `CLOUD_BASE_URL` y otros valores.

- Inicializar la base de datos (crea `./data/edge.db`):
```powershell
npm run init-db
```

- En desarrollo:
```powershell
npm run dev
```

- Ejemplo curl para el endpoint embebido:
```bash
curl -X POST http://localhost:3000/edge/devices/readings \
  -H "Content-Type: application/json" \
  -d '{"deviceId":1,"value":22.3}'
```

Estructura de proyecto y detalles en el repo.
