#!/bin/bash
# Auto-update version.json with current timestamp
# Usage: Add this as a pre-commit hook or run manually

VERSION=$(node -p "require('./package.json').version")
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "{\"version\":\"$VERSION\",\"buildDate\":\"$TIMESTAMP\"}" > public/version.json

echo "Updated version.json to $VERSION ($TIMESTAMP)"
