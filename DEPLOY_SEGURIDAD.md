## Cómo actualizar el sitio con las correcciones de seguridad

Abrí tu PowerShell en la carpeta `E:\MoreMKT` y ejecutá estos dos comandos, **uno a la vez**:

### Paso 1 — Deploy de Functions y Reglas de Firestore
```powershell
firebase deploy --only functions,firestore:rules
```

Esto puede tardar 3-5 minutos. Cuando termine verás algo como:
```
✔  functions[api(us-central1)]: Successful update operation.
✔  firestore: Released rules firestore.rules to cloud.firestore
✔  Deploy complete!
```

### Paso 2 — Verificar que todo funciona
Accedé a tu panel admin: https://morehdmkt.com/admin/login.html y verificá que el login sigue funcionando.

---

> **IMPORTANTE:** El archivo `functions/.env` contiene el JWT_SECRET. **No lo subas a GitHub.**
> El `.gitignore` que creamos lo protege automáticamente.

