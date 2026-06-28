# Aplicación de Lista de la Compra Interactiva

Aplicación web interactiva en formato SPA (Single Page Application) optimizada para dispositivos móviles. Permite gestionar la lista de la compra de forma ágil y local, facilitando su uso directamente en el supermercado.

## Características Principales

* **Importación desde Markdown:** Permite cargar un archivo `.md` con la lista de productos, procesando tolerantemente líneas en texto plano, viñetas (`-` o `*`) o formatos de tareas (`- [ ]`).
* **Entrada Manual Directa:** Posibilidad de añadir nuevos alimentos en tiempo real desde la interfaz superior.
* **Diseño en Dos Columnas:** Organización visual adaptada a pantallas móviles que distribuye los elementos en una cuadrícula de dos columnas para optimizar el espacio.
* **Interactividad Eficiente:** Al pulsar sobre un producto, este se marca como completado (tachado y atenuado) y se desplaza automáticamente al final de la lista.
* **Buscador en Tiempo Real:** Filtrado instantáneo de productos mediante un campo de búsqueda indexado.
* **Persistencia Local:** Sincronización automática con el almacenamiento local del navegador (`LocalStorage`) para evitar la pérdida de datos ante cierres accidentales o falta de cobertura.

## Tecnologías Utilizadas

* HTML5 Semántico
* CSS3 (Diseño Mobile-First, Grid/Flexbox)
* JavaScript Nativo (Vanilla JS, ES6+)

## Instalación y Despliegue

Al ser una aplicación puramente frontend y sin dependencias externas, no requiere ningún proceso de compilación:

1. Clonar o descargar los archivos del repositorio.
2. Abrir el archivo `index.html` en cualquier navegador web.
3. Para despliegue público, es totalmente compatible con servicios de alojamiento estático como GitHub Pages.
