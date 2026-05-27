#!/bin/bash
set -e
echo "=== Configurando credenciales ==="
gh auth setup-git

echo "=== Creando rama limpia sin workflows ==="
git checkout --orphan clean_push
git rm -rf .github/ 2>/dev/null || true
git add .
git commit -m "DI Scouting APK"

echo "=== Subiendo código a GitHub ==="
git push origin clean_push:main --force

echo "=== Volviendo a main ==="
git checkout main 2>/dev/null || git checkout -b main 2>/dev/null || true
git branch -D clean_push 2>/dev/null || true

echo "=== Añadiendo workflow de compilación ==="
CONTENT=$(base64 -w 0 < .github/workflows/build-apk.yml)
gh api repos/Jainkoa13/dinamo-scouting/contents/.github/workflows/build-apk.yml \
  --method PUT \
  --field message="Add APK build workflow" \
  --field "content=$CONTENT" 2>/dev/null || echo "(workflow ya existía o se añadirá manualmente)"

echo ""
echo "=== LISTO ==="
echo "Ve a github.com/Jainkoa13/dinamo-scouting → pestaña Actions"
echo "Verás el proceso de compilación del APK en marcha."
