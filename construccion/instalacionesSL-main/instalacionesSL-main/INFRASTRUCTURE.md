# Configuración de Infraestructura - Instalaciones SL

## 📋 Resumen

Este documento detalla la configuración DNS para conectar el dominio **instalacionessl.com.ar** con Firebase Hosting a través de Cloudflare.

---

## 🌐 URLs del Proyecto

- **URL Firebase (temporal):** https://instalacione-2a21b.web.app
- **URL Dominio Personalizado:** https://instalacionessl.com.ar
- **Proyecto Firebase:** instalacione-2a21b

---

## ✅ Configuración Completada

### 1. Firebase Hosting

**Deployment realizado:**
```bash
firebase deploy --only hosting
```

**Resultado:**
- ✅ Sitio desplegado en: https://instalacione-2a21b.web.app
- ✅ Archivos subidos desde la carpeta `public/`

### 2. Dominio Personalizado en Firebase

**Dominio agregado:** `instalacionessl.com.ar`

**Registros DNS requeridos por Firebase:**
- **Tipo A:** `@` → `199.36.158.100`
- **Tipo TXT:** `@` → `hosting-site=instalacione-2a21b`

### 3. Cloudflare DNS

**Registros configurados en Cloudflare:**

| Tipo | Nombre | Contenido | Proxy Status |
|------|--------|-----------|--------------| 
| A | @ | 199.36.158.100 | DNS only (gris) |
| CNAME | www | instalacione-2a21b.web.app | DNS only (gris) |
| TXT | @ | hosting-site=instalacione-2a21b | - |

> **⚠️ IMPORTANTE:** El Proxy Status debe estar en "DNS only" (nube gris) para que Firebase funcione correctamente.

---

## ⏱️ Estado Actual

**Estado:**
- ✅ Firebase Hosting: Desplegado
- ✅ Dominio agregado en Firebase
- ✅ Registros DNS en Cloudflare: Configurados correctamente
- ✅ Nameservers delegados a Cloudflare
- ✅ **www.instalacionessl.com.ar**: FUNCIONANDO - Sitio en línea con certificado SSL

---

## 📧 Contactos y Accesos

- **Email Firebase:** instalacionessl.ar@gmail.com
- **Hosting:** Firebase Hosting

---

## 🛠️ Comandos Útiles

```bash
# Iniciar emuladores locales
firebase emulators:start

# Desplegar a producción
firebase deploy --only hosting
```

---

**Última actualización:** 2026-03-23
