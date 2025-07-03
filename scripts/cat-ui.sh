#!/bin/bash
# cat-layout.sh
# Prints the important files to understand S3explorer layout, UI shell, and structure.

echo "-----------------src/app/layout.tsx-----------------------"
cat src/app/layout.tsx
echo "---------------- src/app/page.tsx ------------------------"
cat src/app/page.tsx
echo "------------------- src/components/Sidebar.tsx --------------------"
cat src/components/Sidebar.tsx
echo "------------------ src/components/FileTreePane.tsx ----------------------"
cat src/components/FileTreePane.tsx
echo "--------------------- src/components/InspectorPanel.tsx -------------------"
cat src/components/InspectorPanel.tsx
echo "---------------------  src/components/FileTree.tsx -------------------"
cat src/components/FileTree.tsx
echo "---------------------  src/contexts/s3/index.tsx -------------------"
cat src/contexts/s3/index.tsx
echo "---------------------  src/contexts/s3/types.ts -------------------"
cat src/contexts/s3/types.ts
echo "---------------------  src/components/BreadcrumbBar.tsx -------------------"
cat src/components/BreadcrumbBar.tsx
