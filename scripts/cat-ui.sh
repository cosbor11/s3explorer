#!/bin/bash
# cat-layout.sh
# Prints the important files to understand S3explorer layout, UI shell, and structure.

print_file() {
  local file="$1"
  echo ""
  echo "---------------------  $file -------------------"
  cat "$file"
}

print_file "src/app/layout.tsx"
print_file "src/app/page.tsx"
print_file "src/components/Sidebar.tsx"
print_file "src/components/BreadcrumbBar.tsx"
print_file "src/components/FileTreePane.tsx"
print_file "src/components/InspectorPanel.tsx"
print_file "src/components/EditorPane.tsx"
print_file "src/components/S3ConnectionDropdown.tsx"
