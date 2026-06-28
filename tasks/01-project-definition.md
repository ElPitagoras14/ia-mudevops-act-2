# Book Booker

Book Booker es un sistema de reservas de libros pensado para bibliotecas.

## Requisitos previos

- Inicializar git en la raíz del proyecto
- Crear las carpetas `backend/` y `frontend/`

## Descripción

La aplicación va a ser una aplicación full stack que consiste en un frontend, un backend y una base de datos postgresql desplegada con docker.

La aplicación va a contar con 2 usuarios:

- Admin
- User

## Requisitos

### Administrador

- El usuario administrador debe poder ver, crear, editar y eliminar libros.
- El usuario administrador debe poder ver, crear, editar y eliminar usuarios.

### Usuario

- El usuario debe poder ver libros.
- El usuario debe poder reservar y devolver libros.

## Criterios de aceptación

- La aplicación debe estar en funcionamiento.
- El backend cuenta con con tests unitarios.
- El frontend cuenta con con tests unitarios.

## Restricciones

- Cada servicio debe estar dentro de su propia carpeta.
- Utilizar uv como package manager para el backend. Usar --vcs none para que no se inicie un repositorio git. dentro del backend.
- Utilizar FastAPI como framework para el backend.
- Utilizar Tanstack Router para el frontend con pnpm. Documentación: https://tanstack.com/router/latest/docs/quick-start
- Utilizar shadcn/ui para el frontend, ya cuentas con un mcp server y un skill.
- Utilizar context7 para tener documentación actualizada sobre las tecnologías que se van a usar.
- Usar raw queries para las consultas a la base de datos.

## Salida esperada

Debes generar los specs necesarios para la implementación de:

- Backend `backend-spec.md`
- Frontend `frontend-spec.md`
- Base de datos `database-spec.md`

Todos los specs deben estar dentro de la carpeta @tasks con numeración secuencial.