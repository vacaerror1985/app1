const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Usuarios de demostración (en producción usar una base de datos y contraseñas con hash)
const cuentas = [
  { usuario: 'admin', password: 'admin123', nombre: 'Administrador' },
  { usuario: 'carlos', password: 'carlos123', nombre: 'Carlos' }
];
const sesiones = new Map(); // token -> usuario

app.get('/login', (req, res) => {
  res.send(`<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Login</title>
<style>body{font-family:sans-serif;display:flex;justify-content:center;margin-top:80px}
form{display:flex;flex-direction:column;gap:10px;width:260px}input,button{padding:8px}</style></head>
<body><form id="f"><h2>Iniciar sesión</h2>
<input name="usuario" placeholder="Usuario" required>
<input name="password" type="password" placeholder="Contraseña" required>
<button>Entrar</button><p id="msg"></p></form>
<script>
document.getElementById('f').onsubmit = async (e) => {
  e.preventDefault();
  const datos = Object.fromEntries(new FormData(e.target));
  const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) });
  const j = await r.json();
  document.getElementById('msg').textContent = r.ok ? 'Bienvenido ' + j.nombre + ' (token: ' + j.token + ')' : j.error;
};
</script></body></html>`);
});

app.post('/api/login', (req, res) => {
  const { usuario, password } = req.body || {};
  const cuenta = cuentas.find(c => c.usuario === usuario && c.password === password);
  if (!cuenta) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  const token = crypto.randomBytes(24).toString('hex');
  sesiones.set(token, cuenta.usuario);
  res.json({ token, nombre: cuenta.nombre });
});

app.post('/api/logout', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  sesiones.delete(token);
  res.json({ ok: true });
});

function requiereLogin(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!sesiones.has(token)) return res.status(401).json({ error: 'No autenticado' });
  req.usuario = sesiones.get(token);
  next();
}

app.get('/api/perfil', requiereLogin, (req, res) => {
  res.json({ usuario: req.usuario });
});



app.get('/', (req, res) => {
  res.send('Mi segunda  version de la aplicación Node.js con Express de Pascual Bravo 2026 Son muy Tesos');
});

app.get('/api/usuarios', (req, res) => {
  res.json([
    { id: 1, nombre: 'Carlos' },
    { id: 2, nombre: 'Ana' },
    { id: 3, nombre: 'William' },
    { id: 4, nombre: 'Ricardo' },
    { id: 5, nombre: 'Juan' },
    { id: 6, nombre: 'Andees' },
    { id: 7, nombre: 'Margarita' }
  ]);
});

app.listen(3000, () => {
  console.log('Servidor en http://localhost:3000');
});
