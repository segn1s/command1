# Геймифицированный профиль студента («Твой мир больших достижений»)

Веб-приложение на HTML/CSS/JS для **Cloudflare Workers**, превращающее внеучебные достижения студента в развитие четырёх тематических виртуальных городов (**Спорт**, **Творчество**, **Наука**, **Общественная деятельность**).

## Структура проекта

- `wrangler.jsonc` — конфигурация Cloudflare Workers (`assets` из `./public` + Worker `src/index.js`).
- `src/index.js` — Cloudflare Worker (API генерации/проверки 6-значных кодов каждые 30 секунд, поиск студента в Schedion, отдача статики).
- `public/index.html` — экраны и модальные окна приложения.
- `public/css/styles.css` — адаптивная мобильная дизайн-система.
- `public/js/formulas.js` — точные формулы расчёта `D̂`, `B`, `AP`, `DP`, `G` и лиг (`Bronze Owl` — `Diamond Owl`).
- `public/js/illustrations.js` — динамические SVG-иллюстрации островов, городов и комнаты Совы.
- `public/js/match3.js` — мини-игра «Три в ряд» для заработка коинов (`DP`).
- `public/js/data.js` и `public/js/app.js` — каталоги, состояние, дневник достижений, модерация и навигация.

## Локальный запуск и деплой

```bash
npm install
npx wrangler dev      # локальный запуск Worker + статики
npx wrangler deploy   # деплой на Cloudflare Workers
```
