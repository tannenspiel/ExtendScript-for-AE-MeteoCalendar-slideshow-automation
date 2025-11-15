# Справочник констант - MeteoCalendarAnim v1.3

**Дата обновления:** 2025-11-14  
**Версия скрипта:** 1.3

## COMP_NAMES - Имена композиций

```javascript
var COMP_NAMES = {
    MAIN: "MeteoCalendar Main Comp",           // Основная рабочая композиция
    VIDEO: "Video",                            // Композиция для видео
    OUT: "MeteoCalendarOut",                   // Финальная композиция для рендера
    INSTAGRAM: "MeteoCalendar Instagram"      // Композиция для Instagram
};
```

**Использование:** Поиск композиций в проекте After Effects

## LAYER_NAMES - Имена слоев

```javascript
var LAYER_NAMES = {
    METEO_IMAGE: "MeteoImage",                 // Слои метеоизображений (формат: MeteoImage 01, MeteoImage 02 и т.д.)
    METEO_IMAGE_SRC: "MeteoImg_Src",           // Исходные файлы в папке Maps.Work (формат: MeteoImg_Src_01, MeteoImg_Src_02 и т.д.)
    METEO_MASK: "MeteoMask",                   // Маски (формат: MeteoMask 01, MeteoMask 02 и т.д.)
    VIDEO: "Video",                            // Слой видео (первая буква заглавная) ⭐ ОБНОВЛЕНО в v1.3
    HOLDER: "Holder",                          // Слой-держатель для видео
    INTRO: "INTRO",                            // Слой вступления
    BODY: "BODY",                              // Основной слой
    TRANSITION_1ST: "Transition 1st",           // Первый переход
    TRANSITION_2ND: "Transition 2nd",           // Второй переход
    BACKGROUND: "Background",                  // Фон
    BACKGROUND_OVERLAY: "Background Overlay",   // Наложение фона
    LOGO: "Logo Meteo",                        // Логотип
    VIGLETTE: "Viglette"                       // Виньетка
};
```

**Изменения в v1.3:**
- `VIDEO`: изменено с `"VIDEO"` на `"Video"` для соответствия реальному имени слоя

## TIME_CONFIG - Временные параметры

```javascript
var TIME_CONFIG = {
    METEO_IMAGE_DURATION: 17,                  // Длительность показа одного метеоизображения (секунды)
    OUT_LAYERS_OFFSET: 6,                       // Смещение для слоев OUT группы (секунды)
    MASK_CURSOR_POSITION: 1/3                   // Позиция курсора на маске (1/3 = первая треть между in и out point)
};
```

**Использование:** Настройка временных параметров анимации

## LAYER_CONFIG - Параметры слоев

```javascript
var LAYER_CONFIG = {
    MASK_LABEL: 9,                              // Label для масок (цветовая метка в After Effects) ⭐ ВЫНЕСЕНО из магического числа
    TIME_PRECISION: 0.001,                      // Точность сравнения времени (секунды) для проверки совпадения inPoint/outPoint
    MAX_IMAGE_NUMBER: 99,                       // Максимальный номер изображения (для двузначного формата: 01-99)
    FILE_DELETE_DELAY: 100,                     // Задержка перед удалением файла после выполнения BAT (мс)
    OPACITY_FULL: 100,                          // Полная непрозрачность (100%) ⭐ ВЫНЕСЕНО из магического числа
    OPACITY_ZERO: 0,                            // Полная прозрачность (0%) ⭐ ВЫНЕСЕНО из магического числа
    OPACITY_FADE_DURATION: 2,                   // Длительность fade out перед концом слоя (секунды) ⭐ ВЫНЕСЕНО из магического числа
    SCALE_WIDTH_VALUE: -100                     // Значение ширины масштаба для эффекта Geometry2 ⭐ ВЫНЕСЕНО из магического числа
};
```

**Изменения в v1.3:**
- Все магические числа вынесены в константы
- `MASK_LABEL: 9` - заменяет все использования `label === 9`
- `OPACITY_FULL`, `OPACITY_ZERO`, `OPACITY_FADE_DURATION` - заменяют магические числа для opacity
- `SCALE_WIDTH_VALUE` - заменяет магическое число `-100`

## EXPRESSION_CONFIG - Выражения для анимации

```javascript
var EXPRESSION_CONFIG = {
    ROTATION_WIGGLE: "wiggle(0.25,5)",         // Выражение для виггла вращения ⭐ ВЫНЕСЕНО в v1.3
    BLUR_LINEAR: "linear(time, inPoint, inPoint+(outPoint-inPoint)/5, 100, 0)"  // Выражение для линейного размытия ⭐ ВЫНЕСЕНО в v1.3
};
```

**Изменения в v1.3:**
- Выражения вынесены в константы (как целые строки, без разбиения на части)
- `ROTATION_WIGGLE` - заменяет `"wiggle(0.25,5)"`
- `BLUR_LINEAR` - заменяет `"linear(time, inPoint, inPoint+(outPoint-inPoint)/5, 100, 0)"`

**Примечание:** Числа внутри выражений (0.25, 5, 100, 0) не вынесены в отдельные константы, как и было запрошено.

## EFFECT_CONFIG - Параметры эффектов

### KEYLIGHT
```javascript
KEYLIGHT: {
    SCREEN_COLOR: "2A52D9",                // Hex-цвет для экрана (синий)
    VIEW: 5,                                // Режим просмотра
    SCREEN_BALANCE: 95,                     // Баланс экрана
    CLIP_BLACK: 25,                         // Обрезка черного
    CLIP_WHITE: 60                          // Обрезка белого
}
```

### MATTE_CHOKER
```javascript
MATTE_CHOKER: {
    CHOKE_1: 25,                            // Параметр Choke 1
    GRAY_LEVEL_SOFTNESS_1: 0.35             // Мягкость серого уровня
}
```

### SCALE
```javascript
SCALE: {
    MULT: 2,                                // Множитель масштаба
    INITIAL_MULT: 0.75                      // Начальный множитель масштаба
}
```

### REPETILE
```javascript
REPETILE: {
    WIDTH: 1500,                            // Ширина
    HEIGHT: 1500,                           // Высота
    EDGE: 4                                 // Край
}
```

## config - Конфигурация логирования

```javascript
var config = {
    logFile: "./script_log.txt",                // Относительный путь к лог-файлу (в корень проекта)
    maxLogSize: 10000                           // Максимальный размер лог-файла (байт)
};
```

## История изменений констант

### v1.3
- ✅ Вынесены все магические числа в константы
- ✅ Создан `EXPRESSION_CONFIG` для выражений
- ✅ Добавлены константы для opacity (`OPACITY_FULL`, `OPACITY_ZERO`, `OPACITY_FADE_DURATION`)
- ✅ Добавлена константа `SCALE_WIDTH_VALUE`
- ✅ Обновлена константа `LAYER_NAMES.VIDEO` с `"VIDEO"` на `"Video"`

### v1.2 → v1.3
- Добавлены новые константы для улучшения читаемости кода
- Все магические числа заменены на именованные константы

## Рекомендации по использованию

1. **Всегда используйте константы** вместо прямых значений
2. **Не создавайте новые магические числа** - добавляйте новые константы
3. **Обновляйте этот справочник** при добавлении новых констант
4. **Проверяйте соответствие** констант реальным значениям в проекте




