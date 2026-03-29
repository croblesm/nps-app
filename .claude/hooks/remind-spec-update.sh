#!/bin/bash
# Post-edit hook: reminds to update specs after editing code files.
# Configured in .claude/settings.json as a PostToolUse hook on Edit|Write

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only remind for code files, not specs/docs/config
case "$FILE_PATH" in
  */app/*|*/lib/*|*/components/*)
    echo "Reminder: Update the relevant OpenSpec spec and README (if needed) for this change." >&2
    ;;
esac

exit 0
