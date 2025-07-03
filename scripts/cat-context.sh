#!/bin/bash
# cat-important-ai-server.sh

print_file() {
  local file="$1"
  echo ""
  echo "---------------------  $file -------------------"
  cat "$file"
}
print_file "src/contexts/S3ConnectionContext.tsx"
print_file "src/contexts/s3/index.tsx"
print_file "src/contexts/s3/types.ts"
print_file "src/clients/s3.ts"
