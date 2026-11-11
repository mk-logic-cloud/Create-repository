#!/usr/bin/env python3
"""Validates the Wayne Protocol structure: agent and skill frontmatter, required sections,
tool permissions and cross references. Exit code 1 on any error. Requires PyYAML."""
import glob
import os
import re
import sys

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
errors: list[str] = []
KNOWN_TOOLS = {"Read", "Edit", "Write", "Bash", "Grep", "Glob", "WebSearch", "WebFetch", "NotebookEdit"}
AGENT_SECTIONS = ["## Rolle & Fachgebiet", "## Aufgaben", "## Zulässige Werkzeuge", "## Berechtigungsgrenzen", "## Qualitätskriterien", "## Ausgabeformat"]
SKILL_SECTIONS = ["## 1. Zweck", "## 2. Einsatz", "## 3. Eingaben", "## 4. Ablauf", "## 5. Spezialagenten", "## 6. Qualitätskontrolle", "## 7. Ausgabeformat"]
NON_SKILL_ROUTES = {"reports", "agents"}  # app route /reports and built-in Claude Code command /agents
AGENT_REF = re.compile(r"`([a-z]+-(?:analyst|engineer|auditor)[a-z0-9-]*)`")
SKILL_REF = re.compile(r"`/([a-z][a-z-]*)`")


def has_heading(text: str, heading: str) -> bool:
    return re.search(rf"^{re.escape(heading)}[ \t]*$", text, re.M) is not None


def frontmatter(path: str) -> tuple[dict, str]:
    text = open(path, encoding="utf-8").read()
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not m:
        errors.append(f"{path}: missing YAML frontmatter")
        return {}, text
    try:
        return yaml.safe_load(m.group(1)) or {}, text
    except yaml.YAMLError as e:
        errors.append(f"{path}: invalid YAML ({e})")
        return {}, text


agents: dict[str, dict] = {}
for path in sorted(glob.glob(".claude/agents/*.md")):
    fm, text = frontmatter(path)
    name = os.path.basename(path)[:-3]
    agents[name] = fm
    if fm.get("name") != name:
        errors.append(f"{path}: name must equal file name")
    if not re.fullmatch(r"[a-z][a-z0-9-]{0,63}", str(fm.get("name", ""))):
        errors.append(f"{path}: invalid agent name")
    if not 40 <= len(str(fm.get("description", ""))) <= 1024:
        errors.append(f"{path}: description length")
    tools = [t.strip() for t in str(fm.get("tools", "")).split(",") if t.strip()]
    if not tools:
        errors.append(f"{path}: tools must be listed explicitly")
    if set(tools) - KNOWN_TOOLS:
        errors.append(f"{path}: unknown tools {sorted(set(tools) - KNOWN_TOOLS)}")
    if {"Agent", "Task"} & set(tools):
        errors.append(f"{path}: agents must not spawn agents")
    if {"Edit", "Write"} & set(tools) and name != "software-engineer":
        errors.append(f"{path}: only software-engineer may write files")
    for section in AGENT_SECTIONS:
        if not any(re.match(rf"{re.escape(section)}\b", line) for line in text.splitlines()):
            errors.append(f"{path}: missing section '{section}'")

skills = sorted(os.path.basename(os.path.dirname(p)) for p in glob.glob(".claude/skills/*/SKILL.md"))
for name in skills:
    path = f".claude/skills/{name}/SKILL.md"
    fm, text = frontmatter(path)
    if fm.get("name") != name:
        errors.append(f"{path}: name must equal directory name")
    if not 50 <= len(str(fm.get("description", ""))) <= 1024:
        errors.append(f"{path}: description length")
    for section in SKILL_SECTIONS:
        if not has_heading(text, section):
            errors.append(f"{path}: missing section '{section}'")
    if text.count("```") % 2:
        errors.append(f"{path}: unbalanced code fence")

docs = [".claude/skills/%s/SKILL.md" % s for s in skills] + glob.glob(".claude/agents/*.md") + ["CLAUDE.md", "WAYNE_PROTOCOL.md"] + glob.glob("docs/wayne-protocol/*.md")
for path in docs:
    if not os.path.exists(path):
        errors.append(f"{path}: missing")
        continue
    text = open(path, encoding="utf-8").read()
    for agent in set(AGENT_REF.findall(text)):
        if agent not in agents:
            errors.append(f"{path}: unknown agent '{agent}'")
    for skill in set(SKILL_REF.findall(text)) - NON_SKILL_ROUTES:
        if skill not in skills:
            errors.append(f"{path}: unknown skill '/{skill}'")
    for link in re.findall(r"\]\(([^)#\s]+\.md)\)", text):
        if not link.startswith("http") and not os.path.exists(os.path.normpath(os.path.join(os.path.dirname(path), link))):
            errors.append(f"{path}: broken link {link}")

for agent in agents:
    if not any(f"`{agent}`" in open(f".claude/skills/{s}/SKILL.md", encoding="utf-8").read() for s in skills if s != "wayne"):
        errors.append(f"agent '{agent}' is not used by any workflow skill")

print(f"{len(agents)} agents, {len(skills)} skills checked")
if errors:
    print("\n".join(f"ERROR: {e}" for e in errors))
    sys.exit(1)
print("Wayne Protocol validation passed")
