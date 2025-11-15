# ExtendScript Specifics for MeteoCalendarAnim v1.3

## Критические отличия от стандартного JavaScript

### 1. Типы данных и проверки
- Всегда используй `instanceof` для проверки типов AE объектов
- Не используй `constructor.name` — не работает в ExtendScript
- ...

### 2. Индексация коллекций
- Коллекции в AE начинаются с **1**, не с 0!
- Пример: `comp.layer(1)`, `project.item(1)`

### 3. Управление памятью
- Очищай объекты, присваивая `null`
- В `win.onClose` очищай и UI, и AE объекты

### 4. Синхронность
- Нет `async/await`, `Promise`
- `$.sleep()` блокирует UI — используй только для коротких пауз
- Для долгих операций используй `system.execute()` с осторожностью

### 5. Отладка
- Используй ESTK (ExtendScript Toolkit)
- Добавляй `#target aftereffects` в начало скрипта
- Используй `$.writeln()` для быстрой отладки, `log()` — для продакшена

### 6. Производительность
- Кэшируй `app.project.numItems` в переменную
- Избегай доступа к коллекциям внутри циклов

### 7. Работа с файлами
- Используй `fsName` для кроссплатформенных путей
- Всегда проверяй `file.exists` перед операциями

### 8. Регулярные выражения
- Поддерживаются базовые RegExp, но не все фичи ES6
- НЕ используй lookbehind assertions: `(?&lt;=...)`

### 9. Версионность AE
- Проверяй версию: `parseFloat(app.version)`
- Некоторые функции deprecated в новых версиях

## Ссылки на официальную документацию

- **After Effects Scripting Guide**: https://ae-scripting.docsforadobe.dev/
- **Adobe ExtendScript Toolkit**: https://www.adobe.com/devnet/scripting.html

## Встроенная помощь

- Object Model Viewer в ESTK: `Help &gt; Object Model Viewer`
- Scripting Guide в AE: `File &gt; Scripts &gt; Scripting Guide.pdf`

## Примеры кода

```javascript
// Правильная проверка типа
if (item instanceof CompItem) { ... }

// Правильный цикл
for (var i = 1; i &lt;= comp.numLayers; i++) {
    try {
        var layer = comp.layer(i);
        // работа со слоем
    } catch (e) {
        log("Ошибка: " + e.message, "ERROR");
        continue;
    }
}

// Правильная работа с путями
var path = new Folder(folder.fsName + "/subfolder").fsName;