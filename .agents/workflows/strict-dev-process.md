---
description: Planen, freigeben und erst dann implementieren
---

# Strict Development Process

Dieser Workflow definiert den exakten Entwicklungsprozess, der für jede neue Anforderung strikt nacheinander abgearbeitet werden muss.

1. **Stop & Plan**: Ich darf keinen Code anfassen. Stattdessen schreibe ich einen `implementation_plan.md`.
2. **Ticket System**: Ich nutze das GitHub CLI im Terminal (`gh issue create`), um ein Issue zu erstellen. In das Issue füge ich den Implementation Plan als Beschreibung ein. Ich pausiere hier und warte auf die ausdrückliche Freigabe durch den Nutzer.
3. **Git Setup**: Nach der Freigabe nutze ich meine Terminal-Tools, um den Branch zu erstellen (`git checkout -b feature/xyz` oder `bug/...`), mache einen initialen Commit und pushe den Branch in das Remote-Repository.
4. **Implementierung**: Erst jetzt setze ich den Code um und verwalte die Sub-Tasks in meiner `task.md`.
5. **Abschluss**: Ich committe die fertige Arbeit, schließe das GitHub Issue (`gh issue close`) und erstelle zum Schluss den `walkthrough.md`.
