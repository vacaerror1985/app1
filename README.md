# app1

Aplicación Node.js + Express desplegada con Jenkins y Docker en http://10.0.0.238:3000

## Flujo de trabajo

La rama `main` está protegida: los cambios solo entran por Pull Request y después de que Jenkins apruebe el build.

```bash
git checkout main && git pull
git checkout -b feature/mi-cambio
# ... hacer cambios ...
git add -A && git commit -m "Describe el cambio"
git push -u origin feature/mi-cambio
```

En GitHub abre un **Pull Request** hacia `main`, espera el ✔ de Jenkins y haz **Merge**.
Jenkins revisa GitHub cada 2 minutos.

## Qué hace Jenkins

| Rama | Construye imagen | Prueba | Despliega | Crea tag |
|---|---|---|---|---|
| `feature/*` y Pull Requests | ✔ | ✔ | — | — |
| `main` | ✔ | ✔ | ✔ en 10.0.0.238:3000 | ✔ `vX.Y.N` |

## Versiones

`MAYOR.MENOR` sale de `version` en `package.json`; el último número es el build de Jenkins (`v1.0.7`).
Para un cambio grande, sube la versión en `package.json` dentro del Pull Request (por ejemplo `1.1.0`).

## Rutas

- `GET /` – mensaje de bienvenida
- `GET /api/usuarios` – lista de usuarios
- `GET /login` – formulario de inicio de sesión
- `POST /api/login` – devuelve un token
- `GET /api/perfil` – ruta protegida (`Authorization: Bearer <token>`)
- `POST /api/logout` – cierra la sesión
