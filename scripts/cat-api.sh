#!/bin/bash
# cat-important-ai-server.sh

print_file() {
  local file="$1"
  echo ""
  echo "---------------------  $file -------------------"
  cat "$file"
}

print_file "package.json"
print_file "src/contexts/S3ConnectionContext.tsx"
print_file "src/contexts/s3/index.tsx"
print_file "src/contexts/s3/types.ts"
print_file "src/clients/s3.ts"
print_file "src/hooks/useApi.ts"
print_file "pages/api/s3.ts"
print_file "pages/api/session/set-connection.ts"
print_file "pages/api/acl.ts"
print_file "pages/api/policy.ts"
print_file "pages/api/policy-validate.ts"
print_file "pages/api/bucket-meta.ts"
print_file "pages/api/folder-meta.ts"
print_file "pages/api/tags.ts"
print_file "pages/api/cors.ts"
print_file "pages/api/cors-validate.ts"
