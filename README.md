# Miranda Net | Frontend

Interfaz de usuario (SPA) para el sistema de administración de Miranda Net. Diseñada para ser rápida, responsiva y ofrecer herramientas visuales avanzadas para la gestión de clientes, facturación y monitoreo de la red del ISP.

---

## Tecnologías Principales

Este proyecto está construido con un stack moderno enfocado en el rendimiento y la mantenibilidad:

* **Librería Core:** React 18
* **Empaquetador y Servidor de Desarrollo:** Vite
* **Enrutamiento:** React Router DOM
* **Manejo de Formularios:** React Hook Form
* **Peticiones HTTP:** Axios
* **Mapas y Geolocalización:** Leaflet & React-Leaflet
* **Iconografía:** Lucide React
* **Estilos:** CSS Modules

---

## Características Clave

* **Dashboard Financiero:** KPIs globales, cálculo de efectividad histórica, ingresos y control de cierres con déficit.
* **Mapa de Red Georreferenciado:** Visualización interactiva (satelital y de calle) de la infraestructura completa, incluyendo Cajas NAP, antenas y la ubicación exacta de los clientes.
* **Gestión de Inventario:** Control en tiempo real de equipos (routers, antenas), filtrando por estado (libres, asignados o en almacén).
* **Exportación de Datos:** Generación de reportes tabulares en formato CSV para los cierres quincenales y registros históricos.
* **Sincronización de WhatsApp:** Panel de estado en tiempo real para verificar la conexión del bot de mensajería y notificaciones.

---

## Configuración Inicial

Antes de ejecutar el proyecto, es necesario crear un archivo `.env` en la raíz de la carpeta `front_net/`. 

Este archivo debe contener la URL base donde se encuentra operando la API del backend.

### Ejemplo de archivo `.env`

```env
# URL de conexión a la API 
# (Reemplazar localhost por la IP del servidor en producción local, ej: [http://192.168.1.](http://192.168.1.)XX:4000/api)
VITE_API_URL=http://localhost:4000/api
```

---

## Desarrollo Local

Para trabajar en el código fuente con recarga en caliente (Hot Module Replacement), ejecuta los siguientes comandos:

```bash
# 1. Instalar todas las dependencias
npm install

# 2. Iniciar el servidor de desarrollo de Vite
npm run dev
```

---

## Construcción para Producción

Si deseas compilar la aplicación manualmente (fuera del entorno de Docker), sigue estos pasos:

```bash
# 1. Generar los archivos estáticos optimizados en la carpeta /dist
npm run build

# 2. Servir los archivos en una red local (requiere el paquete global 'serve')
serve -s dist -l 5000
```

> **Nota sobre el Despliegue:** Para entornos de producción definitivos, se recomienda utilizar la configuración de Docker (con Nginx o `serve`) provista en la raíz del repositorio principal, la cual automatiza la construcción y el levantamiento del servicio web.
