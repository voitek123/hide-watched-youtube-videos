#!/usr/bin/env bash
# build.sh — packages the extension into a distributable .zip
# Usage: bash build.sh
set -euo pipefail

OUTPUT="hide-watched-youtube-videos.zip"

# Extension source files (everything except repo/dev files)
INCLUDE=(
  manifest.json
  content.js
  styles.css
  popup.html
  popup.css
  popup.js
  _locales/
  icons/
)

rm -f "$OUTPUT"

zip -r "$OUTPUT" "${INCLUDE[@]}"

SIZE=$(du -sh "$OUTPUT" | cut -f1)
echo "✓ Built $OUTPUT ($SIZE)"
echo ""
echo "To install in Firefox:"
echo "  1. Extract the zip (or use the source folder directly)"
echo "  2. Go to about:debugging → This Firefox"
echo "  3. Click 'Load Temporary Add-on…' and select manifest.json"
