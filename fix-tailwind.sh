#!/bin/bash
set -e

echo "🚀 Fixing Tailwind v4 + PostCSS setup for Next.js + Docker..."

# 1️⃣ Remove old configs
rm -f postcss.config.* tailwind.config.*
echo "✅ Removed old Tailwind & PostCSS configs."

# 2️⃣ Create new postcss.config.cjs
cat <<'EOF' > postcss.config.cjs
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
};
EOF
echo "✅ Created postcss.config.cjs"

# 3️⃣ Create new tailwind.config.cjs
cat <<'EOF' > tailwind.config.cjs
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
EOF
echo "✅ Created tailwind.config.cjs"

# 4️⃣ Ensure styles folder & globals.css
mkdir -p src/styles
cat <<'EOF' > src/styles/globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF
echo "✅ Created src/styles/globals.css"

# 5️⃣ Ensure layout.js imports globals.css
LAYOUT_FILE="src/app/layout.js"
if [ -f "$LAYOUT_FILE" ]; then
  if ! grep -q 'import "../styles/globals.css";' "$LAYOUT_FILE"; then
    # macOS/BSD sed fix
    sed -i '' '1s;^;import "../styles/globals.css";\n;' "$LAYOUT_FILE"
    echo "✅ Added globals.css import to layout.js"
  else
    echo "ℹ️ globals.css already imported in layout.js"
  fi
else
  echo "⚠️ layout.js not found — please import globals.css manually."
fi

# 6️⃣ Clean & reinstall dependencies
rm -rf .next node_modules package-lock.json
npm cache clean --force
npm install -D tailwindcss@latest @tailwindcss/postcss autoprefixer
npm install tailwind-merge
npm install
echo "✅ Dependencies installed."

# 7️⃣ Docker rebuild
if [ -f "Dockerfile" ]; then
  echo "🐳 Running docker build --no-cache ..."
  docker build --no-cache .
else
  echo "⚠️ Dockerfile not found — skipping docker build."
fi

echo "🎯 All done! Try running: npm run build"
