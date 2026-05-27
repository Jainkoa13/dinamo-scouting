# Instrucciones para generar el APK

## Requisitos previos

- Node.js 18+
- pnpm 9+
- Android Studio instalado con SDK Android
- Java 17+

## Pasos

### 1. Instalar dependencias (ya hecho en Replit)

```bash
pnpm install
```

### 2. Compilar la app web

```bash
pnpm --filter @workspace/dinamo-apk run build
```

Esto genera la carpeta `artifacts/dinamo-apk/dist/`.

### 3. Inicializar Capacitor Android (solo la primera vez)

```bash
cd artifacts/dinamo-apk
npx cap add android
```

### 4. Sincronizar los assets web con Android

```bash
cd artifacts/dinamo-apk
npx cap sync
```

O usa el script combinado:
```bash
pnpm --filter @workspace/dinamo-apk run cap:sync
```

### 5. Abrir Android Studio

```bash
cd artifacts/dinamo-apk
npx cap open android
```

Esto abre Android Studio con el proyecto `android/`. Desde allí:
- `Build → Generate Signed Bundle/APK` para generar el APK firmado.
- O `Run → Run 'app'` para probarlo en un emulador/dispositivo real.

## Notas

- **Datos locales**: todos los jugadores y equipos se guardan en IndexedDB en el dispositivo. No hay servidor, no hay login.
- **Base de datos**: usa `idb` sobre IndexedDB — los datos persisten aunque se cierre la app.
- **Fotos**: se guardan como base64 en IndexedDB (funciona en Capacitor WebView sin permisos especiales).
- **Excel**: el archivo se descarga usando la API de Blob/URL nativa del WebView.
- **capacitor.config.ts**: el `appId` es `com.dinamoibaiondo.scouting`. Cámbialo si es necesario.

## Configuración del App ID

Para publicar en Google Play Store, necesitas un `appId` único. Édita `capacitor.config.ts`:

```ts
const config: CapacitorConfig = {
  appId: "com.dinamoibaiondo.scouting",  // cambia esto
  appName: "DI Scouting",
  webDir: "dist",
  ...
};
```

## Firma del APK

Para generar un APK firmado:
1. En Android Studio: `Build → Generate Signed Bundle/APK → APK`
2. Crea o selecciona un keystore
3. Completa los campos y elige `release`
4. El APK queda en `android/app/build/outputs/apk/release/app-release.apk`
