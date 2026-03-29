#!/bin/bash
# Pre-commit hook: blocks commits when code files changed but specs/README weren't updated.
# Configured in .claude/settings.json as a PreToolUse hook on Bash(git commit *)

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Skip check for docs-only or chore commits
if echo "$COMMAND" | grep -qE '(docs:|chore:|merge)'; then
  exit 0
fi

# Get staged files
STAGED_FILES=$(cd "$CLAUDE_PROJECT_DIR" && git diff --cached --name-only 2>/dev/null)

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

# Check if code files are staged
CODE_CHANGED=0
for file in $STAGED_FILES; do
  case "$file" in
    app/*|lib/*|components/*)
      CODE_CHANGED=1
      break
      ;;
  esac
done

if [ "$CODE_CHANGED" -eq 0 ]; then
  exit 0
fi

# Check if spec/doc files are also staged
SPEC_CHANGED=0
for file in $STAGED_FILES; do
  case "$file" in
    openspec/*|README.md|CLAUDE.md)
      SPEC_CHANGED=1
      break
      ;;
  esac
done

if [ "$SPEC_CHANGED" -eq 0 ]; then
  echo "BLOCKED: Code files were changed but no spec/README files were updated." >&2
  echo "Per project rules: EVERY code change must include updates to the relevant" >&2
  echo "OpenSpec specs (openspec/), README.md, or CLAUDE.md." >&2
  echo "" >&2
  echo "Staged code files:" >&2
  for file in $STAGED_FILES; do
    case "$file" in
      app/*|lib/*|components/*)
        echo "  - $file" >&2
        ;;
    esac
  done
  echo "" >&2
  echo "Add spec/doc updates to the commit, then try again." >&2
  exit 2
fi

exit 0
