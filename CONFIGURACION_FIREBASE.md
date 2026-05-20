# Guía para Activar el Sistema de Reservas en MoreMKT

Dado que no cuentas con conocimientos de programación, he dejado **todo el código listo**. Sin embargo, por seguridad, hay pasos que debes hacer tú mismo en Google (Firebase) y Mercado Pago.

Sigue estos pasos cuidadosamente:

## Parte 1: Crear el proyecto en Firebase (Base de Datos)

1. Ingresa a [Firebase Console](https://console.firebase.google.com/) con tu cuenta de Google.
2. Haz clic en **"Agregar proyecto"**.
3. Escribe como nombre del proyecto `moremkt-reservas` (o el que prefieras). 
4. Desactiva Google Analytics (no lo necesitas) y haz clic en **"Crear proyecto"**.
5. Cuando esté listo, dale a **Continuar**.

> [!IMPORTANT]
> **Anota el ID del Proyecto:** En la configuración del proyecto de Firebase (el ícono de engranaje ⚙️), busca una línea que dice "ID del proyecto". Por lo general es algo como `moremkt-reservas-a1b2c`.

## Parte 2: Activar la Base de Datos y Autenticación

1. En el menú de la izquierda de Firebase, ve a **Compilación -> Firestore Database** y haz clic en **"Crear base de datos"**.
2. Elige el servidor más cercano (Ej: `southamerica-east1`) y selecciona **Modo de producción**. Dale a Crear.
3. Ahora ve a **Compilación -> Authentication**, dale a "Comenzar" y activa el proveedor **"Correo electrónico y contraseña"**.

## Parte 3: Configurar Mercado Pago

1. Ingresa a la [página para desarrolladores de Mercado Pago](https://www.mercadopago.com.ar/developers/panel/app).
2. Crea una nueva aplicación (nombre: MoreMKT).
3. Entra a "Credenciales de Producción".
4. Copia tu **Access Token** (token de acceso).

## Parte 4: Agregar los Datos al Código

Abre estos archivos con un editor de texto (como el bloc de notas) y actualiza los datos:

**1. En el archivo `admin/js/login.js` y `admin/js/dashboard.js` y `js/booking.js`:**
Busca la línea 3:
`const PROJECT_ID = 'TU-PROJECT-ID';`
Y cambia `TU-PROJECT-ID` por el ID que anotaste en la Parte 1.

**2. En el servidor:**
Como no tienes experiencia con terminales, te recomiendo pedir a un desarrollador de confianza que ejecute estos 2 comandos en la carpeta `e:\MoreMKT\functions`:

```bash
npm install -g firebase-tools
firebase login
firebase init functions
```

Luego, para subir las contraseñas de forma segura al servidor:
```bash
firebase functions:secrets:set MP_ACCESS_TOKEN
# (Aquí pegas tu Access Token de Mercado Pago)
firebase functions:secrets:set JWT_SECRET
# (Aquí escribes una contraseña aleatoria larga)
```

Y finalmente para subir el código:
```bash
firebase deploy --only functions
```

¡Con eso tu sistema de cobros estará listo!

## ¿Cómo acceder al panel?
1. Una vez publicado todo, entra a `http://tusitio.com/admin/login.html`
2. El desarrollador deberá crear tu primer usuario en la base de datos (Firestore) en una colección llamada `admin_users` con tu email y una contraseña encriptada (con bcrypt). ¡O puedes avisarme y te creo un script rápido para hacerlo!
