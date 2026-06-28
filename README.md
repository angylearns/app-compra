# Aplicación de Lista de la Compra Colaborativa

Aplicación web interactiva en formato SPA (Single Page Application) optimizada para dispositivos móviles, diseñada para la gestión sincronizada y en tiempo real de listas de la compra entre varios usuarios.

## Características Destacadas

* **Sincronización en Tiempo Real:** Utiliza Firebase Firestore para que cualquier cambio se refleje instantáneamente en todos los dispositivos conectados mediante una contraseña de acceso global.
* **Diseño UI/UX Optimizado:**
    * **Vista en cuadrícula:** Listas organizadas en dos columnas para maximizar la legibilidad en pantallas pequeñas.
    * **Sticky Header:** Encabezado fijo que mantiene a mano el buscador, los filtros y el botón de "Terminar Compra".
    * **Controles Compactos:** Formulario de añadir productos optimizado (50% Nombre, 25% Tag, 25% Botón).
* **Gestión Inteligente de Búsqueda:** Buscador en tiempo real con botón dedicado para limpieza rápida de filtros.
* **Sistema de Tags Personalizado:**
    * **C (Azul):** Identificación visual de productos de compra.
    * **D (Rojo):** Identificación de productos de despensa/emergencia.
    * **M (Amarillo):** Identificación de productos de mantenimiento.
* **Edición Inline Avanzada:** Sustitución de `prompt` por inputs integrados en la misma fila para una modificación ágil y fluida de los productos.
* **Gestión de Ciclo de Vida:** Funcionalidad completa para transferir productos de la "Despensa" a la "Lista Actual" y limpieza de productos completados.

## Tecnologías Utilizadas

* **Frontend:** HTML5 Semántico, CSS3 (Grid/Flexbox para diseño responsivo) y JavaScript Nativo (Vanilla JS).
* **Backend:** Firebase Firestore (Base de datos NoSQL en tiempo real).
* **Autenticación:** Sistema de validación basado en llaves de acceso dinámicas en `localStorage`.

## Estructura de la Interfaz

1. **Pantalla de Acceso:** Protegida mediante contraseña global.
2. **Dashboard (App Container):**
    * **Header Sticky:**
        * Pestañas de navegación (Despensa / Lista Actual).
        * Panel de entrada de datos (Inputs 50/25/25).
        * Buscador con botón de borrado rápido.
        * Panel de filtrado rápido por Tags (C, D, M) y botón "Terminar compra" (solo en Lista Actual).
    * **Contenedor de Listas:** Renderizado dinámico de productos en cuadrícula de dos columnas.

## Instalación y Configuración

1. **Firebase:** Crea un proyecto en la [Firebase Console](https://console.firebase.google.com/) y habilita Firestore.
2. **Configuración:** Actualiza el objeto `firebaseConfig` en el archivo `app.js` con tus credenciales.
3. **Reglas de Seguridad:** Asegúrate de configurar las reglas de Firestore para permitir acceso a las colecciones dinámicas según el `accessKey`.
4. **Despliegue:** Sube el proyecto a un servidor de archivos estáticos (GitHub Pages, Vercel, Netlify).

## Uso
* **Acceder:** Introduce la contraseña compartida por tu grupo para sincronizar la misma base de datos.
* **Despensa:** Haz clic en cualquier producto para enviarlo a la lista actual.
* **Edición:** Pulsa el icono `✎` para editar nombre o tag directamente en la fila.
* **Finalizar:** Marca los productos como realizados en "Lista actual" y pulsa el botón "Terminar compra" para eliminarlos definitivamente.
