# Test Setup

Contexto de la aplicación a testear: @tasks/archive/

Vamos a realizar una suite completa de tests para el backend y el frontend.

## Librerías (Instalar en caso de no existir)

### Backend

- pytest

### Frontend

- jest
- playwright (pruebas de interfaz)

## Flujo de trabajo

1. Analizar las funcionalidades existentes de la aplicación.
2. Analizar los test existentes de la aplicación.
3. Escribir 2 archivos markdown en la carpeta @tasks con el nombre `02-backend-tests.md` y `03-frontend-tests.md` respectivamente donde se indicarán las funcionalidades que se van a testear.

## Restricciones

- El alcance de los tests debe contener las funcionalidaes en el happy path y los test de error considerando los edge cases.
- Seccionar los archivo markdown en 3 secciones:
  - Tests unitarios
  - Tests de integración
  - Tests de interfaz (frontend)
