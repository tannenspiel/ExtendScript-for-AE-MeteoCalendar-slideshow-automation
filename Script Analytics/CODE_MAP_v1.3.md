# Карта кода - MeteoCalendarAnim v1.3

**Дата создания:** 2025-11-14  
**Дата последнего обновления:** 2025-01-XX  
**Версия скрипта:** 1.3  
**Общее количество строк:** ~4404

**Последние изменения:**
- Добавлена система undo для всех кнопок (app.beginUndoGroup/endUndoGroup)
- Добавлена кнопка "Restore Files" для восстановления файлов из Maps.BAK
- Создана панель "Project Cleanup" для управления очисткой проекта
- Добавлена глобальная переменная g_clearUndoData для хранения данных отмены

## Структура файла

### 1. Константы и конфигурация (строки 1-81)

```
1-9:    COMP_NAMES - Имена композиций
11-26:  LAYER_NAMES - Имена слоев
28-33:  TIME_CONFIG - Временные параметры
35-45:  LAYER_CONFIG - Параметры слоев
47-51:  EXPRESSION_CONFIG - Выражения для анимации
53-75:  EFFECT_CONFIG - Параметры эффектов
77-81:  config - Конфигурация логирования
```

### 2. Утилиты и инфраструктура (строки 84-263)

```
84-136:     log() - Логирование (НОВОЕ: добавлен finally блок для закрытия файлов)
138-143:   Перехват alert для логирования
145-172:   safeExecute() - Безопасное выполнение функций (НОВОЕ: валидация объектов в debug режиме, профилирование)
174-213:   resolvePath() - Разрешение путей
215-219:   escapePath() - Экранирование путей
221-261:   normalizeAndValidatePath() - Нормализация и валидация путей (НОВОЕ)
263-287:   validateFolderPath() - Валидация путей
289-313:   getScaleExpression() - Получение выражений масштабирования
```

### 3. Создание UI (строки 321-564)

```
321:        Создание главного окна "Meteo Calendar v 1.3"
326:        Создание tabbedPanel
331:        mainTab - Основная вкладка
337:        settingsTab - Вкладка настроек

Основные элементы UI:
- txtFolderPath - Путь к папке с изображениями
- txtBackupFolderPath - Путь к папке бэкапа
- txtVideoInputPath - Путь к входному видео
- txtVideoOutputPath - Путь к выходному видео
- txtCompName - Имя композиции
- txtProjectFolder - Папка проекта
- txtVideoProjectFolder - Папка видео проекта
- txtRenderTemplate1 - Шаблон рендера 1
- txtRenderTemplate2 - Шаблон рендера 2
- debugCheck - Чекбокс Debug Mode (НОВОЕ в v1.3)

Кнопки:
- btnImportImage - Импорт изображений
- btnSortMasks - Сортировка масок (НОВОЕ в v1.3)
- btnPlaceImage - Размещение изображения
- btnClearImages - Очистка изображений
- btnRestoreFiles - Восстановление файлов из Maps.BAK (НОВОЕ: система undo)
- btnMatte - Применение матов
- btnOutMask - Выходная маска
- btnImportMask - Импорт маски
- btnScaleAll - Масштабирование всех
- btnScaleUp - Увеличение масштаба
- btnScaleDown - Уменьшение масштаба
- transformButton - Трансформация
- btnOpacity - Непрозрачность
- btnMoveVideoIn - Перемещение видео внутрь
- btnMoveLayers - Перемещение слоев
- btnMoveVideoInOut - Перемещение видео внутрь/наружу
- btnImportVideo - Импорт видео
- btnOut - Выход

Панели:
- grpProjectCleanup - Панель "Project Cleanup" (НОВОЕ: содержит clearCheck, btnClearImages, btnRestoreFiles)
  - clearCheck - Чекбокс "Enable Clear"
  - btnClearImages - Кнопка "Clear Project"
  - btnRestoreFiles - Кнопка "↶ Restore Files"
```

### 4. Обработчики закрытия окна (строки 532-564)

```
532-564: win.onClose - Очистка глобальных ссылок (НОВОЕ: добавлена очистка debugCheck)
```

### 5. Функции-геттеры и debug инструменты (строки 566-655) (НОВОЕ в v1.3)

```
566-599:   UI_GETTERS - Объект с функциями-геттерами для UI
           - folderPath(), backupPath(), compName(), projectFolder()
           - videoProjectFolder(), videoInputPath(), videoOutputPath()
           - renderTemplate1(), renderTemplate2(), isDebugMode()

601-620:   PerfTimer - Объект для профилирования производительности
           - start(name) - начало измерения
           - end(name) - окончание и вывод результата
           - Работает только в debug режиме

622-627:   debugLog(message) - Логирование только в debug режиме

629-655:   isLayerValid(obj) - Валидация объектов AE
           - Проверка на null/undefined
           - Проверка базовых свойств
           - Обработка исключений
```

### 6. Инициализация переменных (строки 657-815)

```
508-510:   folderPath, folder
529-531:   backupFolderPath, backupFolder
550-552:   ComposeName
564-566:   ProjectFolderName
578-580:   ProjectVideoFolderName
592-594:   VideoInputPath
606-608:   VideoOutputPath
620-622:   RenderTemplate1
634-636:   RenderTemplate2
713-715:   g_clearUndoData - Глобальная переменная для отмены Clear Project (НОВОЕ: система undo)
                        Хранит данные для восстановления файлов из Maps.BAK
```

### 6. Обработчики кнопок (строки 656-4159)

**ВАЖНО:** Все обработчики кнопок обернуты в `app.beginUndoGroup()` / `app.endUndoGroup()` (НОВОЕ: система undo)
Это позволяет отменять все операции через Ctrl+Z в After Effects.

#### 6.1. Очистка и управление проектом

```
873-937:   btnClearImages.onClick - Очистка проекта (ОБНОВЛЕНО: добавлена поддержка undo)
           - Обернут в app.beginUndoGroup("Clear Project")
           - BAT-операции выполняются ВНЕ undo-группы (не отменяются через Ctrl+Z)
           - Операции в AE выполняются ВНУТРИ undo-группы (отменяются через Ctrl+Z)
           - Сохраняет данные в g_clearUndoData для восстановления файлов
           → createBackupAEProject()
           → universalCleanup() (BAT-операции)
           → clearMeteoImageLayers() (AE-операции)
           → clearProjectFolder()
           → renameAndSortMasks()

940-1005:  btnRestoreFiles.onClick - Восстановление файлов из Maps.BAK (НОВОЕ)
           - Обернут в app.beginUndoGroup("Restore Files from Backup")
           - Копирует файлы из Maps.BAK обратно в Maps.Work
           - Использует данные из g_clearUndoData

706-733:   universalCleanup() - Универсальная очистка
734-854:   cleanupWithDirectCommands() - Очистка через прямые команды
855-906:   clearFolder() - Очистка папки
907-977:   clearFolderWithCMD() - Очистка через CMD
978-1039:  standardCleanup() - Стандартная очистка

1040-1079: clearMeteoImageLayers() - Очистка слоев изображений

1080-1492: renameAndSortMasks() - Переименование и сортировка масок
           → isValidMaskLayer()
           → getMaskNumber()
           → getImageLayerName()
           (НОВОЕ в v1.3: отдельная кнопка Sort Masks)

1493-1546: clearProjectFolder() - Очистка папки проекта

1547-1580: clearWorkFolder() - Очистка рабочей папки

1581-1599: checkWorkFolder() - Проверка рабочей папки

1600-1626: copyFilesToBackup() - Копирование в бэкап

1627-1658: createBackupAEProject() - Создание бэкапа проекта
```

#### 6.2. Импорт и размещение изображений

```
1670-1804: ImportImages() - Импорт изображений
           → hasAllowedExtension()
           → getNextMeteoImageNumber()
           → renameImageSource()
           → findFreeMaskNew()
           → placeImageUnderMask()

1805-1829: deselectFolderElements() - Снятие выделения

2451-2897: placeImageUnderMask() - Размещение изображения под маской
           → removeIncorrectImageLayers()
           → isValidMaskLayer()
           → getMaskNumber()
           → getImageLayerName()
           → isImageInMapsTemp()

2111-2212: removeIncorrectImageLayers() - Удаление некорректных слоев

2213-2419: findFreeMaskNew() - Поиск свободной маски
           → isValidMaskLayer()
           → getMaskNumber()

2420-2450: isImageInMapsTemp() - Проверка папки Maps.Temp
```

#### 6.3. Обработчики кнопок размещения

```
2083-2093: btnImportImage.onClick - Импорт изображений (ОБНОВЛЕНО: добавлена поддержка undo)
           - Обернут в app.beginUndoGroup("Import Images")
           → ImportImages()

3027-3056: btnSortMasks.onClick - Сортировка масок (НОВОЕ в v1.3, ОБНОВЛЕНО: добавлена поддержка undo)
           - Обернут в app.beginUndoGroup("Sort & Fix Masks")
           → renameAndSortMasks()

3058-3279: btnPlaceImage.onClick - Размещение изображения (ОБНОВЛЕНО: добавлена поддержка undo)
           - Обернут в app.beginUndoGroup("Place Image Under Mask")
           → ImportImages()
           → findFreeMaskNew()
           → placeImageUnderMask()
           (ИЗМЕНЕНО в v1.3: убрана сортировка масок)
```

#### 6.4. Остальные обработчики

**ВАЖНО:** Все обработчики обернуты в app.beginUndoGroup() / app.endUndoGroup() для поддержки отмены через Ctrl+Z

```
3281-3303: btnScaleDown.onClick - Уменьшение масштаба (ОБНОВЛЕНО: добавлена поддержка undo)
3305-3327: btnScaleUp.onClick - Увеличение масштаба (ОБНОВЛЕНО: добавлена поддержка undo)
3330-3378: btnMatte.onClick - Применение матов (ОБНОВЛЕНО: добавлена поддержка undo)
3380-3415: btnOutMask.onClick - Выходная маска (ОБНОВЛЕНО: добавлена поддержка undo)
3417-3493: btnImportMask.onClick - Импорт маски (ОБНОВЛЕНО: добавлена поддержка undo)
3495-3526: btnMoveVideoIn.onClick - Перемещение видео внутрь (ОБНОВЛЕНО: добавлена поддержка undo)
3528-3722: btnMoveVideoInOut.onClick - Перемещение видео внутрь/наружу (ОБНОВЛЕНО: добавлена поддержка undo)
3724-3755: btnMoveLayers.onClick - Перемещение слоев (ОБНОВЛЕНО: добавлена поддержка undo)
3757-3780: btnOpacity.onClick - Непрозрачность (ОБНОВЛЕНО: добавлена поддержка undo)
3782-3826: btnScaleAll.onClick - Масштабирование всех (ОБНОВЛЕНО: добавлена поддержка undo)
3828-3861: transformButton.onClick - Трансформация (ОБНОВЛЕНО: добавлена поддержка undo)
3863-4051: btnImportVideo.onClick - Импорт видео (ОБНОВЛЕНО: добавлена поддержка undo)
4056-4159: btnOut.onClick - Выход (ОБНОВЛЕНО: добавлена поддержка undo)
```

### 7. Вспомогательные функции (строки 3721-3914)

```
3721-3784: ScaleLayer() - Масштабирование слоя
           → getScaleExpression()

3785-3797: findCompByName() - Поиск композиции по имени

3803-3914: validateProjectStructure() - Валидация структуры проекта
           → findCompByName()
           → isValidMaskLayer()
           (НОВОЕ в v1.3)
```

### 8. Валидация и проверки (строки 1908-2027)

```
1908-1957: isValidMaskLayer() - Проверка валидности маски
           (ИЗМЕНЕНО в v1.3: автоматическое исправление label)

1958-1975: getMaskNumber() - Извлечение номера маски

1976-1985: getImageLayerName() - Получение имени слоя изображения

1986-2027: getNextMeteoImageNumber() - Получение следующего номера

2028-2110: renameImageSource() - Переименование источника изображения
```

### 9. Инициализация при запуске (строки 3916-3931)

```
3916-3924: Логирование при запуске
3926-3927: validateProjectStructure() - Валидация при запуске
3929:     win.show() - Отображение окна
3931:     Логирование отображения интерфейса
```

## Граф зависимостей функций

### Основные потоки выполнения

#### 1. Импорт и размещение изображений
```
ImportImages()
  ├─ hasAllowedExtension()
  ├─ getNextMeteoImageNumber()
  ├─ renameImageSource()
  ├─ findFreeMaskNew()
  │   └─ isValidMaskLayer()
  │       └─ getMaskNumber()
  └─ placeImageUnderMask()
      ├─ removeIncorrectImageLayers()
      ├─ isValidMaskLayer()
      ├─ getMaskNumber()
      ├─ getImageLayerName()
      └─ isImageInMapsTemp()
```

#### 2. Сортировка масок
```
renameAndSortMasks()
  ├─ findCompByName()
  ├─ isValidMaskLayer() (для каждой маски)
  │   └─ getMaskNumber()
  └─ getImageLayerName() (для каждой картинки)
```

#### 3. Очистка проекта
```
btnClearProject.onClick
  ├─ universalCleanup()
  │   ├─ cleanupWithDirectCommands()
  │   ├─ clearFolder()
  │   ├─ clearFolderWithCMD()
  │   └─ standardCleanup()
  └─ clearMeteoImageLayers()
```

#### 4. Валидация проекта
```
validateProjectStructure()
  ├─ findCompByName() (для каждой композиции)
  └─ isValidMaskLayer() (для каждой маски)
```

## Ключевые изменения в v1.3

### Новые функции
- ✅ `renameAndSortMasks()` - вынесена в отдельную кнопку
- ✅ `validateProjectStructure()` - валидация при запуске
- ✅ `normalizeAndValidatePath()` - нормализация и валидация путей для безопасности BAT-файлов
- ✅ `win.onClose` - очистка глобальных ссылок
- ✅ `isLayerValid(obj)` - валидация объектов AE (НОВОЕ: 2025-11-14)
- ✅ `debugLog(message)` - логирование только в debug режиме (НОВОЕ: 2025-11-14)
- ✅ `UI_GETTERS` - объект с функциями-геттерами для UI (НОВОЕ: 2025-11-14)
- ✅ `PerfTimer` - объект для профилирования производительности (НОВОЕ: 2025-11-14)

### Измененные функции
- ✅ `isValidMaskLayer()` - автоматическое исправление label
- ✅ `placeImageUnderMask()` - использование имен вместо индексов
- ✅ `findFreeMaskNew()` - улучшенная валидация
- ✅ `renameAndSortMasks()` - поддержка картинок при сортировке
- ✅ `cleanupWithDirectCommands()` - использование `normalizeAndValidatePath()` для безопасности
- ✅ `clearFolderWithCMD()` - использование `normalizeAndValidatePath()` и проверка существования папок
- ✅ `getNextMeteoImageNumber()` - защита от переполнения номеров
- ✅ `log()` - добавлен `finally` блок для гарантированного закрытия файлов (НОВОЕ: 2025-11-14)
- ✅ `safeExecute()` - добавлена валидация объектов в debug режиме и профилирование (НОВОЕ: 2025-11-14)

### Новые константы
- ✅ `EXPRESSION_CONFIG` - выражения для анимации
- ✅ `LAYER_CONFIG.OPACITY_FULL`, `OPACITY_ZERO`, `OPACITY_FADE_DURATION`
- ✅ `LAYER_CONFIG.SCALE_WIDTH_VALUE`

### Обновленные константы
- ✅ `LAYER_NAMES.VIDEO`: "VIDEO" → "Video"

## Структура UI

```
Window "Meteo Calendar v 1.3"
└─ TabbedPanel
   ├─ Tab "Main"
   │  ├─ Group "Import & Place"
   │  │  ├─ btnImportImage
   │  │  ├─ btnSortMasks (НОВОЕ)
   │  │  └─ btnPlaceImage
   │  ├─ Group "Clear"
   │  │  └─ btnClearImages
   │  ├─ Group "Effects"
   │  │  ├─ btnMatte
   │  │  ├─ btnOutMask
   │  │  └─ btnImportMask
   │  ├─ Group "Scale"
   │  │  ├─ btnScaleAll
   │  │  ├─ btnScaleUp
   │  │  └─ btnScaleDown
   │  ├─ Group "Transform"
   │  │  ├─ transformButton
   │  │  └─ btnOpacity
   │  ├─ Group "Move"
   │  │  ├─ btnMoveVideoIn
   │  │  ├─ btnMoveLayers
   │  │  └─ btnMoveVideoInOut
   │  └─ Group "Video & Render"
   │     ├─ btnImportVideo
   │     └─ btnOut
   └─ Tab "Settings: Variables"
      ├─ Panel "Paths" (настройки путей)
      ├─ Panel "Names & Templates" (имена и шаблоны)
      └─ Panel "Debug & Performance" (НОВОЕ: debug режим)
         └─ debugCheck - Чекбокс Debug Mode
```

## Основные патчи и секции

```
PATCH 1: ДОБАВЛЕНИЕ КОНФИГУРАЦИИ И ЛОГИРОВАНИЯ (строка 77)
PATCH 2: ОПТИМИЗАЦИЯ ВЫРАЖЕНИЙ МАСШТАБИРОВАНИЯ (строка 238)
PATCH 3: ОБНОВЛЕННЫЕ ОБРАБОТЧИКИ С ВАЛИДАЦИЕЙ (строка 511)
PATCH 4: ОСНОВНЫЕ ФУНКЦИИ С ОБРАБОТКОЙ ОШИБОК (строка 656)
PATCH 5: ФУНКЦИИ ИМПОРТА С ЛОГИРОВАНИЕМ (строка 1651)
PATCH 6: ОСТАЛЬНЫЕ ФУНКЦИИ С ОБРАБОТКОЙ ОШИБОК (строка 1830)
PATCH 7: ИНИЦИАЛИЗАЦИЯ ЛОГИРОВАНИЯ ПРИ ЗАПУСКЕ (строка 3916)
PATCH 8: ДОБАВЛЕНИЕ ОТСУТСТВУЮЩИХ ОБРАБОТЧИКОВ КНОПОК (строка 2898)
```

## Статистика

- **Всего функций:** 40 (+3 новых: `isLayerValid()`, `debugLog()`, + объекты `UI_GETTERS`, `PerfTimer`)
- **Всего констант:** 6 групп
- **Всего кнопок UI:** 18
- **Всего обработчиков:** 18
- **Строк кода:** ~4154
- **Строк комментариев:** ~500+

## Примечания

1. Все функции используют `safeExecute()` для обработки ошибок
2. Все операции логируются через `log()` (с гарантированным закрытием файлов в `finally`)
3. Все пути валидируются через `validateFolderPath()`
4. Все BAT-файлы используют `escapePath()` и `normalizeAndValidatePath()` для безопасности
5. Валидация структуры проекта выполняется при запуске
6. Глобальные ссылки очищаются при закрытии окна
7. **НОВОЕ (2025-11-14):** Добавлены функции-геттеры `UI_GETTERS` для предотвращения утечек памяти
8. **НОВОЕ (2025-11-14):** Добавлен Debug режим с профилированием через `PerfTimer`
9. **НОВОЕ (2025-11-14):** Добавлена валидация объектов AE через `isLayerValid()` в debug режиме
10. **НОВОЕ (2025-11-14):** Исправлено закрытие файлов в `finally` блоке для предотвращения утечек памяти

