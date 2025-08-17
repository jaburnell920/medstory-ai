#!/bin/bash
rm -f test-openai.js
git reset --soft HEAD~2
git reset HEAD test-openai.js
echo "Cleanup completed"
