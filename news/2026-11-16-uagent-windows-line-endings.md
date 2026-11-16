---
type: bugfix
project: uAgent
series: uagent
title: uAgent 0.2.3 — исправлена проверка на Windows
version: 0.2.3
queued_at: 2026-11-16T20:39:20Z
repo_url: https://github.com/sunpole/uAgent
web_url: https://sunpole.github.io/uAgent/
image: 2026-11-16-uagent-windows-line-endings.png
image_origin: real
---

uAgent 0.2.3 — обновление надёжности сборки на Windows.

Исправлена ложная ошибка синхронизации сайта, версии и README, когда Git использует окончания строк CRLF вместо LF. Реальные расхождения содержимого по-прежнему обнаруживаются. Добавлены единые правила Git и автоматическая проверка карты репозитория.

На изображении — настоящий снимок сгенерированной страницы uAgent 0.2.3, открытой браузером Chromium в проверочной среде.

Короткий текст для Telegram:
uAgent 0.2.3 — исправлена проверка проекта на Windows. Генератор больше не считает LF и CRLF содержательным изменением. Добавлены автоматические тесты и проверка карты репозитория.
