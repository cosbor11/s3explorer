#!/bin/bash
# cat-important-ai-server.sh

print_file() {
  local file="$1"
  echo ""
  echo "---------------------  $file -------------------"
  cat "$file"
}
print_file "src/hooks/useApi.ts"
print_file "pages/api/s3.ts"
print_file "pages/api/session/set-connection.ts"
