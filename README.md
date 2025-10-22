> 🕒 API para el cálculo de **fechas hábiles en Colombia**, considerando fines de semana y festivos nacionales.

![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Express](https://img.shields.io/badge/Express.js-black)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

---

## 📘 Descripción

Esta API permite sumar **días y horas hábiles** a una fecha dada, teniendo en cuenta los **festivos oficiales de Colombia**, los fines de semana y los horarios laborales.

✅ **Ejemplo de uso:**
GET http://localhost:3000/api/working-date?days=1&hours=4&date=2025-04-10T15:00:00Z

css
Copiar código

📤 **Respuesta:**
```json
{
  "date": "2025-04-21T20:00:00Z"
}
🧠 Características principales
Cálculo de días y horas hábiles (lunes a viernes).

Considera los festivos nacionales colombianos.

Excluye automáticamente los fines de semana.

Zona horaria de referencia: America/Bogota.

Respuestas en formato UTC (ISO 8601 con sufijo “Z”).

Manejo de errores claros y detallados.

⚙️ Instalación
bash
Copiar código
# Clonar el repositorio
git clone https://github.com/<tu-usuario>/working-days-colombia.git

# Ingresar al proyecto
cd working-days-colombia

# Instalar dependencias
npm install
🚀 Ejecución del servidor
bash
Copiar código
npm run dev
El servidor se ejecutará en:

arduino
Copiar código
http://localhost:3000
🧪 Pruebas con REST Client (VS Code)
📄 Archivo: test.http

Instala la extensión REST Client (autor: Huachao Mao) desde el marketplace de VS Code.

Abre el archivo test.http.

Haz clic en “Send Request” sobre cada bloque.

Verás las respuestas de la API directamente dentro del editor.

🧩 Endpoints disponibles
Método	Endpoint	Descripción
GET	/api/working-date	Calcula la fecha hábil final según los parámetros enviados.

🔹 Parámetros soportados:
Parámetro	Tipo	Requerido	Descripción
date	string	❌	Fecha de inicio en formato ISO (UTC). Si no se envía, usa la actual.
days	number	❌	Cantidad de días hábiles a sumar.
hours	number	❌	Cantidad de horas hábiles a sumar.

🔹 Ejemplo de error:
sql
Copiar código
GET /api/working-date
📥 Respuesta:

json
Copiar código
{
  "error": "InvalidParameters",
  "message": "Debe enviar al menos uno de los parámetros: days u hours."
}
🧩 Estructura del proyecto
pgsql
Copiar código
📦 working-days-colombia
 ┣ 📂 src
 ┃ ┣ 📜 server.ts
 ┃ ┗ 📜 routes.ts
 ┣ 📜 package.json
 ┣ 📜 tsconfig.json
 ┣ 📜 test.http
 ┗ 📜 README.md
👨‍💻 Autor
Juan David Sierra Ocampo
Desarrollador Backend | Ingeniería de Sistemas
📍 Medellín, Colombia


🪪 Licencia
Este proyecto se distribuye bajo la licencia MIT.
Puedes usarlo, modificarlo y adaptarlo libremente con atribución.
