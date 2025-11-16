// ⚠️ КРИТИЧНО: ПРАВИЛА РАБОТЫ С ЭТИМ ПРОЕКТОМ ⚠️
// 
// ПЕРЕД ЛЮБЫМИ ИЗМЕНЕНИЯМИ ОБЯЗАТЕЛЬНО:
// 1. Прочитать файл 00-main-rules.mdc в папке .cursor/rules
// 2. Проверить структуру проекта (папка Script Analytics)
// 3. Прочитать существующую документацию в Script Analytics/
// 4. НИКОГДА не создавать новые файлы документации в корне - только обновлять существующие в Script Analytics/
// 
// Все правила работы с кодом находятся в файле 00-main-rules.mdc
// Документация находится в папке Script Analytics/
//
// ============================================================================

// === КОНСТАНТЫ ПРОЕКТА ===
// ВНИМАНИЕ: Скрипт заточен строго под конкретный AE-проект
// Имена композиций
var COMP_NAMES = {
    MAIN: "MeteoCalendar Main Comp",           // Основная рабочая композиция
    VIDEO: "Video",                            // Композиция для видео
    OUT: "MeteoCalendarOut",                   // Финальная композиция для рендера
    INSTAGRAM: "MeteoCalendar Instagram"      // Композиция для Instagram
};

// Имена слоев
var LAYER_NAMES = {
    METEO_IMAGE: "MeteoImage",                 // Слои метеоизображений (формат: MeteoImage 01, MeteoImage 02 и т.д.)
    METEO_IMAGE_SRC: "MeteoImg_Src",           // Исходные файлы в папке Maps.Work (формат: MeteoImg_Src_01, MeteoImg_Src_02 и т.д.)
    METEO_MASK: "MeteoMask",                   // Маски (формат: MeteoMask 01, MeteoMask 02 и т.д.)
    VIDEO: "Video",                            // Слой видео (первая буква заглавная)
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

// Временные параметры
var TIME_CONFIG = {
    METEO_IMAGE_DURATION: 17,                  // Длительность показа одного метеоизображения (секунды)
    OUT_LAYERS_OFFSET: 6,                       // Смещение для слоев OUT группы (секунды)
    MASK_CURSOR_POSITION: 1/3                   // Позиция курсора на маске (1/3 = первая треть между in и out point)
};

// Параметры слоев
var LAYER_CONFIG = {
    MASK_LABEL: 9,                              // Label для масок (цветовая метка в After Effects)
    IMAGE_LABEL: 5,                             // Label для правильных картинок (цветовая метка в After Effects)
    IMAGE_INCORRECT_LABEL: 1,                   // Label для неправильных картинок (цветовая метка в After Effects)
    TIME_PRECISION: 0.001,                      // Точность сравнения времени (секунды) для проверки совпадения inPoint/outPoint
    MAX_IMAGE_NUMBER: 99,                       // Максимальный номер изображения (для двузначного формата: 01-99)
    FILE_DELETE_DELAY: 100,                     // Задержка перед удалением файла после выполнения BAT (мс)
    OPACITY_FULL: 100,                          // Полная непрозрачность (100%)
    OPACITY_ZERO: 0,                            // Полная прозрачность (0%)
    OPACITY_FADE_DURATION: 2,                   // Длительность fade out перед концом слоя (секунды)
    SCALE_WIDTH_VALUE: -100                     // Значение ширины масштаба для эффекта Geometry2
};

// Выражения для анимации
var EXPRESSION_CONFIG = {
    ROTATION_WIGGLE: "wiggle(0.25,5)",         // Выражение для виггла вращения
    BLUR_LINEAR: "linear(time, inPoint, inPoint+(outPoint-inPoint)/5, 100, 0)"  // Выражение для линейного размытия
};

// Параметры эффектов
var EFFECT_CONFIG = {
    KEYLIGHT: {
        SCREEN_COLOR: "2A52D9",                // Hex-цвет для экрана (синий)
        VIEW: 5,                                // Режим просмотра
        SCREEN_BALANCE: 95,                     // Баланс экрана
        CLIP_BLACK: 25,                         // Обрезка черного
        CLIP_WHITE: 60                          // Обрезка белого
    },
    MATTE_CHOKER: {
        CHOKE_1: 25,                            // Параметр Choke 1
        GRAY_LEVEL_SOFTNESS_1: 0.35             // Мягкость серого уровня
    },
    SCALE: {
        MULT: 2,                                // Множитель масштаба
        INITIAL_MULT: 0.75                      // Начальный множитель масштаба
    },
    REPETILE: {
        WIDTH: 1500,                            // Ширина
        HEIGHT: 1500,                           // Высота
        EDGE: 4                                 // Край
    }
};

// === PATCH 1: ДОБАВЛЕНИЕ КОНФИГУРАЦИИ И ЛОГИРОВАНИЯ ===
var config = {
    logFile: "./script_log.txt",                // Относительный путь к лог-файлу (в корень проекта)
    maxLogSize: 10000
};

/**
 * Функция логирования сообщений в консоль и файл
 * @param {String} message - сообщение для логирования
 * @param {String} [type] - тип сообщения (INFO, ERROR, WARNING, SUCCESS, DEBUG, SYSTEM, ALERT)
 */
function log(message, type) {
    var now = new Date();
    var timestamp = now.getFullYear() + "-" + 
                   (now.getMonth() + 1) + "-" + 
                   now.getDate() + " " + 
                   now.getHours() + ":" + 
                   now.getMinutes() + ":" + 
                   now.getSeconds();
    var logEntry = "[" + timestamp + "] " + (type ? type + ": " : "") + message + "\n";
    
    // Выводим в консоль
    $.writeln(logEntry);
    
    // Записываем в файл
    // ⭐ КРИТИЧНО: Используем finally для гарантированного закрытия файла
    var logFile = null;
    var resolvedLogPath = null;
    try {
        // Для лог-файла используем корень проекта (где находится скрипт)
        var scriptFile = new File($.fileName);
        var scriptFolder = scriptFile.parent;
        var logFileName = config.logFile.replace("./", "").replace("../", "");
        resolvedLogPath = scriptFolder.fsName + "/" + logFileName;
        logFile = new File(resolvedLogPath);
        
        if (logFile.exists && logFile.length > config.maxLogSize) {
            logFile.remove();
        }
        
        logFile.open("a");
        
        // Добавляем UTF-8 BOM при создании файла (для Windows Notepad)
        if (logFile.length === 0) {
            logFile.write("\uFEFF"); // BOM для Windows Notepad
        }
        
        logFile.write(logEntry);
        
    } catch (e) {
        // Если не удалось записать в файл, просто выводим в консоль
        $.writeln("Ошибка записи в лог-файл: " + e.message);
        $.writeln("Путь к лог-файлу: " + (resolvedLogPath || "не определен"));
    } finally {
        // ⭐ КРИТИЧНО: Гарантированно закрываем файл, даже при ошибке
        if (logFile && logFile.opened) {
            try {
                logFile.close();
            } catch (e) {
                $.writeln("Ошибка закрытия лог-файла: " + e.message);
            }
        }
    }
}

// Перехват alert для логирования
var originalAlert = alert;
alert = function(message) {
    log("ALERT: " + message, "ALERT");
    originalAlert(message);
};

/**
 * Обработчик ошибок для безопасного выполнения функций
 * @param {String} funcName - имя функции для логирования
 * @param {Function} func - функция для выполнения
 * @param {Array} args - аргументы для передачи в функцию
 * @returns {*} результат выполнения функции или null при ошибке
 */
function safeExecute(funcName, func, args) {
    try {
        // ⭐ DEBUG MODE: Валидация аргументов (только в debug режиме)
        if (UI_GETTERS && UI_GETTERS.isDebugMode && UI_GETTERS.isDebugMode()) {
            for (var i = 0; i < args.length; i++) {
                if (args[i] && typeof args[i].name !== 'undefined' && !isLayerValid(args[i])) {
                    var errorMsg = "Передан невалидный объект AE в " + funcName + " (аргумент #" + i + ")";
                    log(errorMsg, "ERROR");
                    throw new Error(errorMsg);
                }
            }
        }
        
        log("Выполнение функции: " + funcName, "INFO");
        if (PerfTimer && PerfTimer.start) PerfTimer.start(funcName);
        var result = func.apply(null, args);
        if (PerfTimer && PerfTimer.end) PerfTimer.end(funcName);
        log("Функция " + funcName + " выполнена успешно", "SUCCESS");
        return result;
    } catch (error) {
        var errorMsg = "Ошибка в " + funcName + ": " + error.message + 
                      " (строка: " + error.line + ")";
        log(errorMsg, "ERROR");
        alert(errorMsg);
        return null;
    }
}

/**
 * Сохраняет состояние для отката перед выполнением действия
 * @param {String} actionName - название действия
 * @param {Object} stateData - данные состояния (опционально)
 */

/**
 * Преобразует относительные пути в абсолютные
 * @param {String} relativePath - относительный путь
 * @returns {String} абсолютный путь
 */
function resolvePath(relativePath) {
    if (!relativePath || relativePath === "") {
        return relativePath;
    }
    
    // Если путь уже абсолютный (начинается с буквы диска или /)
    if ((relativePath.length > 1 && relativePath.charAt(1) === ":") || relativePath.charAt(0) === "/") {
        return relativePath;
    }
    
    // Обрабатываем относительные пути
    if (relativePath.indexOf("./") === 0 || relativePath.indexOf("../") === 0) {
        // ⭐ ИСПРАВЛЕНИЕ: Для ВСЕХ путей (включая script_log.txt) используем корень проекта (папка, где находится скрипт)
        var scriptFile = new File($.fileName);
        var scriptFolder = scriptFile.parent;
        var parentPath = scriptFolder.fsName;
        
        // ⭐ ИСПРАВЛЕНИЕ: Для всех путей используем папку скрипта как корень проекта
        var resolvedPath = parentPath + "/" + relativePath.replace("./", "").replace("../", "");
        $.writeln("[resolvePath] " + relativePath + " -> " + resolvedPath);
        return resolvedPath;
    }
    
    // Если путь без префикса, считаем его относительным к папке скрипта
    var scriptFile = new File($.fileName);
    var scriptFolder = scriptFile.parent;
    var resolvedPath = scriptFolder.fsName + "/" + relativePath;
    $.writeln("[resolvePath] " + relativePath + " -> " + resolvedPath);
    return resolvedPath;
}

// === PATCH: ЭКРАНИРОВАНИЕ ПУТЕЙ ДЛЯ БЕЗОПАСНОСТИ BAT-ФАЙЛОВ ===
/**
 * Экранирует путь для безопасного использования в BAT-файлах
 * Заменяет кавычки на двойные кавычки (стандартное экранирование в Windows)
 * @param {String} path - путь для экранирования
 * @returns {String} экранированный путь
 */
function escapePath(path) {
    if (!path) return '""';
    // Заменяем кавычки на двойные кавычки (стандартное экранирование в Windows)
    return '"' + path.replace(/"/g, '""') + '"';
}

/**
 * Нормализует и валидирует путь для безопасного использования в BAT-файлах
 * Проверяет, что путь находится внутри проекта AE и не содержит опасных символов
 * @param {String} path - путь для нормализации
 * @returns {String} нормализованный абсолютный путь
 * @throws {Error} если путь небезопасен
 */
function normalizeAndValidatePath(path) {
    if (!path || path === "") {
        throw new Error("Путь не может быть пустым");
    }
    
    // Разрешаем относительный путь
    var resolvedPath = resolvePath(path);
    
    // Нормализуем через Folder для получения абсолютного пути
    var folder = new Folder(resolvedPath);
    var normalizedPath = folder.fsName;
    
    // Проверяем, что путь находится внутри проекта AE (если проект сохранен)
    var projectFile = app.project.file;
    if (projectFile) {
        var projectPath = projectFile.path;
        var projectFolder = new Folder(projectPath);
        var projectRoot = projectFolder.parent.fsName; // Родительская папка проекта
        
        // Проверяем, что нормализованный путь начинается с корня проекта
        if (normalizedPath.indexOf(projectRoot) !== 0) {
            throw new Error("Путь '" + normalizedPath + "' выходит за пределы проекта! Разрешен только доступ к папкам внутри: " + projectRoot);
        }
    }
    
    // Проверяем наличие опасных символов в пути (после нормализации они должны быть удалены, но проверяем на всякий случай)
    // Спецсимволы &, |, >, <, ; не должны быть в путях Windows, но проверяем
    var dangerousChars = /[&|><;`$]/;
    if (dangerousChars.test(normalizedPath)) {
        throw new Error("Путь содержит опасные символы: " + normalizedPath);
    }
    
    return normalizedPath;
}

/**
 * Валидирует путь к папке и при необходимости создает её
 * @param {String} path - путь к папке
 * @param {Boolean} shouldCreate - создавать папку, если не существует
 * @returns {Boolean} true если папка существует или создана успешно
 */
function validateFolderPath(path, shouldCreate) {
    if (!path || path === "") {
        log("Пустой путь к папке", "WARNING");
        return false;
    }
    
    var resolvedPath = resolvePath(path);
    var folder = new Folder(resolvedPath);
    if (!folder.exists) {
        if (shouldCreate) {
            try {
                folder.create();
                log("Создана папка: " + resolvedPath, "INFO");
                return true;
            } catch (e) {
                log("Не удалось создать папку: " + resolvedPath + " - " + e.message, "ERROR");
                return false;
            }
        } else {
            log("Папка не существует: " + resolvedPath, "WARNING");
            return false;
        }
    }
    return true;
}

/**
 * Генерирует выражение для масштабирования слоя
 * @param {String} type - тип масштабирования ("down" или "up")
 * @returns {String} выражение для свойства Scale
 */
function getScaleExpression(type) {
    var baseExpression = 
        "// OPTIMIZED SCALE EXPRESSION " + type.toUpperCase() + "\n" +
        "var layer = thisLayer, comp = thisComp;\n" +
        "var MultScale = effect('ScaleMult')('Slider');\n" +
        "var InitialScaleMult = effect('InitialScaleMult')('Slider');\n" +
        "var baseScale = (comp.width / layer.width * 100) * InitialScaleMult;\n" +
        "var t = time - inPoint;\n" +
        "var dur = outPoint - inPoint;\n" +
        "var progress = t / dur;\n";
    
    if (type === "down") {
        return baseExpression + 
            "var startScale = MultScale * baseScale;\n" +
            "var endScale = baseScale;\n" +
            "var currentScale = startScale - progress * (startScale - endScale);\n" +
            "[currentScale, currentScale];";
    } else {
        return baseExpression + 
            "var startScale = baseScale;\n" +
            "var endScale = MultScale * baseScale;\n" +
            "var currentScale = startScale + progress * (endScale - startScale);\n" +
            "[currentScale, currentScale];";
    }
}

var scaleDownExpression = getScaleExpression("down");
var scaleUpExpression = getScaleExpression("up");

// Создаем панель с вкладками
var win = new Window("palette", "Meteo Calendar v 1.3", undefined);
win.orientation = "column";
win.alignChildren = ['fill','fill'];

// Создаем панель с вкладками
var tabbedPanel = win.add("tabbedpanel", undefined);
tabbedPanel.alignChildren = ['fill','fill'];

// Вкладка 1: Основные функции
var mainTab = tabbedPanel.add("tab", undefined, "Main");
mainTab.orientation = "column";
mainTab.alignChildren = ['fill','fill'];


// Вкладка 2: Настройки
var settingsTab = tabbedPanel.add("tab", undefined, "Settings: Variables");
settingsTab.orientation = "column";
settingsTab.alignChildren = ['fill','fill'];
    
    // Группа Paths
    var grpPaths = settingsTab.add("panel", undefined, "Paths");
    grpPaths.alignChildren = ['fill','fill'];
    grpPaths.orientation = "row";
    
    // Левая группа - поля ввода для Paths
    var grpPathsFields = grpPaths.add("group", undefined, "");
    grpPathsFields.orientation = "column";
    grpPathsFields.alignChildren = ['fill','fill'];
    
    var txtFolderPath = grpPathsFields.add('edittext', undefined, "./Maps.Work");
    txtFolderPath.size = [250, 20];
    
    var txtBackupFolderPath = grpPathsFields.add('edittext', undefined, "./Maps.BAK");
    txtBackupFolderPath.size = [250, 20];
    
    var txtVideoInputPath = grpPathsFields.add('edittext', undefined, "./video");
    txtVideoInputPath.size = [250, 20];
    
    var txtVideoOutputPath = grpPathsFields.add('edittext', undefined, "./Previews");
    txtVideoOutputPath.size = [250, 20];
    
    // Правая группа - названия для Paths
    var grpPathsLabels = grpPaths.add("group", undefined, "");
    grpPathsLabels.orientation = "column";
    grpPathsLabels.alignChildren = ['fill','fill'];
    
    grpPathsLabels.add("statictext", undefined, "Images Path:");
    grpPathsLabels.add("statictext", undefined, "Backup Path:");
    grpPathsLabels.add("statictext", undefined, "Video Input:");
    grpPathsLabels.add("statictext", undefined, "Video Output:");
    
    // Группа Names & Templates
    var grpNames = settingsTab.add("panel", undefined, "Names & Templates");
    grpNames.alignChildren = ['fill','fill'];
    grpNames.orientation = "row";
    
    // Левая группа - поля ввода для Names & Templates
    var grpNamesFields = grpNames.add("group", undefined, "");
    grpNamesFields.orientation = "column";
    grpNamesFields.alignChildren = ['fill','fill'];
    
    var txtCompName = grpNamesFields.add('edittext', undefined, "MeteoCalendar Main Comp");
    txtCompName.size = [250, 20];
    
    var txtProjectFolder = grpNamesFields.add('edittext', undefined, "Maps.Work");
    txtProjectFolder.size = [250, 20];
    
    var txtVideoProjectFolder = grpNamesFields.add('edittext', undefined, "VideoSrc");
    txtVideoProjectFolder.size = [250, 20];
    
    var txtRenderTemplate1 = grpNamesFields.add('edittext', undefined, "H.264 - Match Render Settings - 5 Mbps");
    txtRenderTemplate1.size = [250, 20];
    
    var txtRenderTemplate2 = grpNamesFields.add('edittext', undefined, "JPG");
    txtRenderTemplate2.size = [250, 20];
    
    // Правая группа - названия для Names & Templates
    var grpNamesLabels = grpNames.add("group", undefined, "");
    grpNamesLabels.orientation = "column";
    grpNamesLabels.alignChildren = ['fill','fill'];
    
    grpNamesLabels.add("statictext", undefined, "Comp Name:");
    grpNamesLabels.add("statictext", undefined, "Project Folder:");
    grpNamesLabels.add("statictext", undefined, "Video Folder:");
    grpNamesLabels.add("statictext", undefined, "Render Template 1:");
    grpNamesLabels.add("statictext", undefined, "Render Template 2:");
    
    // ⭐ DEBUG MODE: Чекбокс для включения debug режима
    var grpDebug = settingsTab.add("panel", undefined, "Debug & Performance");
    grpDebug.alignChildren = ['fill','fill'];
    grpDebug.orientation = "column";
    
    var debugCheck = grpDebug.add("checkbox", undefined, "Debug Mode (включает профилирование и детальное логирование)");
    debugCheck.value = false;

    var grpImport = mainTab.add("group", undefined, "Variables"); 
    grpImport.orientation = "row";
    grpImport.alignChildren = ['fill','fill'];
    
        // ⭐ ИЗМЕНЕНО: Увеличена кнопка Import Image в два раза по вертикали
        var btnImportImage = grpImport.add("button", undefined, "Import Image");
                btnImportImage.size = [250,50];
        var importCheck = grpImport.add("checkbox", undefined, "Import All");
        importCheck.value = false;

    // ⭐ НОВАЯ КНОПКА: Сортировка масок
    var btnSortMasks = mainTab.add("button", undefined, "Sort & Fix Masks");
            btnSortMasks.size = [250,25];
    
    // ⭐ ИЗМЕНЕНО: Увеличена кнопка Place Image в два раза по вертикали
    var btnPlaceImage = mainTab.add("button", undefined, "Place Image");
            btnPlaceImage.size = [250,50];

    // ⭐ ПАНЕЛЬ УПРАВЛЕНИЯ ПРОЕКТОМ: Очистка и восстановление
    var grpProjectCleanup = mainTab.add("panel", undefined, "Project Cleanup");
        grpProjectCleanup.alignChildren = ['fill','top'];
        grpProjectCleanup.orientation = "column";
    
        var clearCheck = grpProjectCleanup.add("checkbox", undefined, "Enable Clear");
            clearCheck.value = false;
        
        var btnClearImages = grpProjectCleanup.add("button", undefined, "Clear Project");
            btnClearImages.size = [250,25];
        
        // ⭐ КНОПКА ВОССТАНОВЛЕНИЯ ФАЙЛОВ после Clear Project
        var btnRestoreFiles = grpProjectCleanup.add("button", undefined, "↶ Restore Files");
            btnRestoreFiles.size = [250,25];


    var grpBot = mainTab.add("panel", undefined, "Adjust Images");
        grpBot.alignChildren = ['fill','top'];
        grpBot.orientation = "row";

    
    var grpLeft = grpBot.add("group", undefined, "grpLeft");    
        var grpMatte = grpLeft.add("panel", undefined, "Matte");
            
            var btnMatte = grpMatte.add("button", undefined, "Matte");
                btnMatte.size = [100,25];
            
            var btnOutMask = grpMatte.add("button", undefined, "Out Mask");
                btnOutMask.size = [100,25];

            var btnImportMask = grpMatte.add("button", undefined, "Import Mask");
                btnImportMask.size = [100,25];

            

        

    var grpMid = grpBot.add("group", undefined, "grpMid");
        var grpScale = grpMid.add("panel", undefined, "Scale");
            
            var btnScaleAll = grpScale.add("button", undefined, "Scale All");
                btnScaleAll.size = [100,25];

            var btnScaleUp = grpScale.add("button", undefined, "Scale Up");
                btnScaleUp.size = [100,25];

            var btnScaleDown = grpScale.add("button", undefined, "Scale Down");
                btnScaleDown.size = [100,25];



    var grpRight = grpBot.add("group", undefined, "grpRight"); 
        var grpTransform = grpRight.add("panel", undefined, "Transform");
            
            var transformButton = grpTransform.add("button", undefined, "Flip");
                transformButton.size = [100,25];
            
            var btnOpacity = grpTransform.add("button", undefined, "Opacity");
                btnOpacity.size = [100,25];


    var grpBotBot = mainTab.add("panel", undefined, "Adjust Video");
        grpBotBot.alignChildren = ['fill','top'];
        grpBotBot.orientation = "column";

        // Группа для первых двух кнопок
        var grpTopButtons = grpBotBot.add("group", undefined, "");
        grpTopButtons.orientation = "row";
        grpTopButtons.alignChildren = ['fill','top'];

        var btnMoveVideoIn = grpTopButtons.add("button", undefined, "Move Video In");
                btnMoveVideoIn.size = [100,25];
        
        var btnMoveLayers = grpTopButtons.add("button", undefined, "Move Layers");
            btnMoveLayers.size = [100,25];

        // Группа для третьей кнопки
        var grpBottomButton = grpBotBot.add("group", undefined, "");
        grpBottomButton.orientation = "row";
        grpBottomButton.alignChildren = ['fill','top'];

        var btnMoveVideoInOut = grpBottomButton.add("button", undefined, "<< Move Video In-Out >>");
            btnMoveVideoInOut.size = [200,25];

    var grpVideoPipeline = mainTab.add("panel", undefined, "Video Pipeline");
        grpVideoPipeline.alignChildren = ['fill','top'];
        grpVideoPipeline.orientation = "column";

        var grpVideoTop = grpVideoPipeline.add("group", undefined, "");
        grpVideoTop.orientation = "row";
        grpVideoTop.alignChildren = ['fill','top'];

        var btnImportVideo = grpVideoTop.add("button", undefined, "Import Video");
            btnImportVideo.size = [250,25];

        var grpVideoBottom = grpVideoPipeline.add("group", undefined, "");
        grpVideoBottom.orientation = "row";
        grpVideoBottom.alignChildren = ['fill','top'];

        var btnOut = grpVideoBottom.add("button", undefined, "OUT");
            btnOut.size = [250,50];

// === PATCH: ОБРАБОТЧИК ЗАКРЫТИЯ ОКНА ДЛЯ ПРЕДОТВРАЩЕНИЯ УТЕЧКИ ПАМЯТИ ===
win.onClose = function() {
    // Очистка глобальных ссылок на UI-элементы
    txtFolderPath = null;
    txtBackupFolderPath = null;
    txtVideoInputPath = null;
    txtVideoOutputPath = null;
    txtCompName = null;
    txtProjectFolder = null;
    txtVideoProjectFolder = null;
    txtRenderTemplate1 = null;
    txtRenderTemplate2 = null;
    btnImportImage = null;
    btnPlaceImage = null;
    btnClearImages = null;
    btnMatte = null;
    btnOutMask = null;
    btnImportMask = null;
    btnScaleAll = null;
    btnScaleUp = null;
    btnScaleDown = null;
    transformButton = null;
    btnOpacity = null;
    btnMoveVideoIn = null;
    btnMoveLayers = null;
    btnMoveVideoInOut = null;
    btnImportVideo = null;
    btnOut = null;
    folder = null;
    backupFolder = null;
    debugCheck = null;
    log("Окно закрыто, ссылки очищены", "INFO");
};

// === ⭐ ФУНКЦИИ-ГЕТТЕРЫ ДЛЯ UI (предотвращение утечек памяти) ===
// Вместо глобальных переменных используем функции, которые всегда читают актуальные значения из UI
var UI_GETTERS = {
    folderPath: function() { 
        return txtFolderPath ? txtFolderPath.text : "./Maps.Work"; 
    },
    backupPath: function() { 
        return txtBackupFolderPath ? txtBackupFolderPath.text : "./Maps.BAK"; 
    },
    compName: function() { 
        return txtCompName ? txtCompName.text : COMP_NAMES.MAIN; 
    },
    projectFolder: function() { 
        return txtProjectFolder ? txtProjectFolder.text : "Maps.Work"; 
    },
    videoProjectFolder: function() { 
        return txtVideoProjectFolder ? txtVideoProjectFolder.text : "VideoSrc"; 
    },
    videoInputPath: function() { 
        return txtVideoInputPath ? txtVideoInputPath.text : "./video"; 
    },
    videoOutputPath: function() { 
        return txtVideoOutputPath ? txtVideoOutputPath.text : "./Previews"; 
    },
    renderTemplate1: function() { 
        return txtRenderTemplate1 ? txtRenderTemplate1.text : "H.264 - Match Render Settings - 5 Mbps"; 
    },
    renderTemplate2: function() { 
        return txtRenderTemplate2 ? txtRenderTemplate2.text : "JPG"; 
    },
    isDebugMode: function() {
        return debugCheck ? debugCheck.value : false;
    }
};

// === ⭐ DEBUG ИНСТРУМЕНТЫ ===

// Performance Timer для профилирования (только в debug режиме)
var PerfTimer = {
    _timers: {},
    
    start: function(name) {
        if (!UI_GETTERS.isDebugMode()) return;
        this._timers[name] = new Date().getTime();
    },
    
    end: function(name) {
        if (!UI_GETTERS.isDebugMode()) return 0;
        if (!this._timers[name]) return 0;
        var duration = new Date().getTime() - this._timers[name];
        log("[PERF] " + name + ": " + duration + "ms", "DEBUG");
        delete this._timers[name];
        return duration;
    }
};

/**
 * Debug логирование (только в debug режиме)
 * @param {String} message - сообщение для логирования
 */
function debugLog(message) {
    if (UI_GETTERS.isDebugMode()) {
        log("[DEBUG] " + message, "DEBUG");
    }
}

// === ⭐ ВАЛИДАЦИЯ ОБЪЕКТОВ AE ===
/**
 * Проверяет, является ли объект AE (слой, композиция и т.д.) валидным и безопасным для использования
 * @param {Object} obj - Объект AE для проверки
 * @returns {boolean} - true если объект валиден, false если нет
 */
function isLayerValid(obj) {
    try {
        // Тройная проверка: null, undefined, и доступность свойств
        if (obj === null || obj === undefined) return false;
        
        // Проверяем наличие базовых свойств слоя
        if (typeof obj.name === 'undefined') return false;
        
        // Проверяем, что объект не был удален (провоцируем доступ к свойству)
        var testName = obj.name;
        var testInPoint = obj.inPoint;
        
        // Некоторые объекты AE имеют свойство isValid
        if (obj.isValid !== undefined && obj.isValid === false) return false;
        
        return true;
    } catch(e) {
        // Если при проверке возникла ошибка, объект невалиден
        return false;
    }
}

// TimeLength заменен на TIME_CONFIG.METEO_IMAGE_DURATION

// === ГЛОБАЛЬНАЯ ПЕРЕМЕННАЯ ДЛЯ ОТМЕНЫ CLEAR PROJECT ===
// Хранит данные для восстановления файлов из Maps.BAK после BAT-операций
var g_clearUndoData = null;

////////////////////////////////////
var folderPath = txtFolderPath.text;  
var folder = new Folder(resolvePath(folderPath)); 

// === PATCH 3: ОБНОВЛЕННЫЕ ОБРАБОТЧИКИ С ВАЛИДАЦИЕЙ ===
txtFolderPath.onChange = function()
{
    safeExecute("folderPathChange", function() {
        folderPath = txtFolderPath.text;  
        var resolvedPath = resolvePath(folderPath);
        folder = new Folder(resolvedPath);
        
        if (folderPath && folderPath !== "") {
            if (validateFolderPath(resolvedPath, true)) {
                log("Путь к изображениям изменен: " + folderPath + " -> " + resolvedPath, "INFO");
            }
        } else {
            this.text = "Введите путь к папки с изображениями (например, ./images)";
        }
    }, []);
}

var backupFolderPath = txtBackupFolderPath.text;  
var backupFolder = new Folder(resolvePath(backupFolderPath)); 

txtBackupFolderPath.onChange = function()
{
    safeExecute("backupPathChange", function() {
        backupFolderPath = txtBackupFolderPath.text;  
        var resolvedPath = resolvePath(backupFolderPath);
        backupFolder = new Folder(resolvedPath);
        
        if (backupFolderPath && backupFolderPath !== "") {
            if (validateFolderPath(resolvedPath, true)) {
                log("Путь к бэкапу изменен: " + backupFolderPath + " -> " + resolvedPath, "INFO");
            }
        } else {
            this.text = "Введите путь к папки с изображениями (например, ./backup)";
        }
    }, []);
}

////////////////////////////////////
var ComposeName = txtCompName.text; 
txtCompName.onChange = function()
{
    safeExecute("compNameChange", function() {
        ComposeName = txtCompName.text;  
        if (this.text == '') {
            this.text = "Введите название рабочей композиции";
        } else {
            log("Название композиции изменено: " + ComposeName, "INFO");
        }
    }, []);
}

////////////////////////////////////
var ProjectFolderName = txtProjectFolder.text;
txtProjectFolder.onChange = function()
{
    safeExecute("projectFolderChange", function() {
        ProjectFolderName = txtProjectFolder.text;
        if (this.text == '') {
            this.text = "Введите название папки проекта (например, Footages)";
        } else {
            log("Название папки проекта изменено: " + ProjectFolderName, "INFO");
        }
    }, []);
}

////////////////////////////////////
var ProjectVideoFolderName = txtVideoProjectFolder.text;
txtVideoProjectFolder.onChange = function()
{
    safeExecute("videoFolderChange", function() {
        ProjectVideoFolderName = txtVideoProjectFolder.text;
        if (this.text == '') {
            this.text = "Введите название папки с видео проекта (например, Video)";
        } else {
            log("Название видео папки изменено: " + ProjectVideoFolderName, "INFO");
        }
    }, []);
}

////////////////////////////////////
var VideoInputPath = txtVideoInputPath.text;
txtVideoInputPath.onChange = function()
{
    safeExecute("videoInputPathChange", function() {
        VideoInputPath = txtVideoInputPath.text;
        if (this.text == '') {
            this.text = "Введите путь к папке с видео (например, D:/video)";
        } else {
            log("Путь к видео изменен: " + VideoInputPath, "INFO");
        }
    }, []);
}

////////////////////////////////////
var VideoOutputPath = txtVideoOutputPath.text;
txtVideoOutputPath.onChange = function()
{
    safeExecute("videoOutputPathChange", function() {
        VideoOutputPath = txtVideoOutputPath.text;
        if (this.text == '') {
            this.text = "Введите путь к папке для рендера (например, D:/Previews)";
        } else {
            log("Путь для рендера изменен: " + VideoOutputPath, "INFO");
        }
    }, []);
}

////////////////////////////////////
var RenderTemplate1 = txtRenderTemplate1.text;
txtRenderTemplate1.onChange = function()
{
    safeExecute("renderTemplate1Change", function() {
        RenderTemplate1 = txtRenderTemplate1.text;
        if (this.text == '') {
            this.text = "Введите название шаблона рендера (например, H.264 - Match Render Settings - 5 Mbps)";
        } else {
            log("Шаблон рендера 1 изменен: " + RenderTemplate1, "INFO");
        }
    }, []);
}

////////////////////////////////////
var RenderTemplate2 = txtRenderTemplate2.text;
txtRenderTemplate2.onChange = function()
{
    safeExecute("renderTemplate2Change", function() {
        RenderTemplate2 = txtRenderTemplate2.text;
        if (this.text == '') {
            this.text = "Введите название шаблона рендера (например, JPG)";
        } else {
            log("Шаблон рендера 2 изменен: " + RenderTemplate2, "INFO");
        }
    }, []);
}

// Устанавливаем активность кнопки в соответствии со значением чекбокса
btnClearImages.enabled = clearCheck.value;

// Добавляем обработчик событий для чекбокса
clearCheck.onClick = function() {
    btnClearImages.enabled = clearCheck.value;
    log("Clear enabled: " + clearCheck.value, "INFO");
}

// === PATCH 4: ОСНОВНЫЕ ФУНКЦИИ С ОБРАБОТКОЙ ОШИБОК ===

// === ОБНОВЛЕННЫЙ ОБРАБОТЧИК CLEAR PROJECT С ПОДДЕРЖКОЙ UNDO ===
btnClearImages.onClick = function() {
    app.beginUndoGroup("Clear Project");
    
    try {
        if (!clearCheck.value) {
            alert("Сначала включите чекбокс 'Enable Clear'!");
            return false;
        }
        
        log("=== ЗАПУСК УЛУЧШЕННОЙ ОЧИСТКИ ===", "INFO");
        
        var resolvedFolderPath = resolvePath(folderPath);
        var resolvedBackupPath = resolvePath(backupFolderPath);
        
        // ⭐ ШАГ 1: Создаем бэкап проекта AE (это отменится автоматически через Ctrl+Z)
        createBackupAEProject();
        
        // ⭐ ШАГ 2: BAT-операции (ВНЕ undo-группы - не отменяются через Ctrl+Z)
        // Выполняем ВНЕ safeExecute, так как это файловые операции
        var cleanupSuccess = false;
        try {
            cleanupSuccess = universalCleanup(resolvedFolderPath, resolvedBackupPath);
        } catch (e) {
            log("Ошибка при BAT-очистке: " + e.message, "ERROR");
            cleanupSuccess = false;
        }
        
        // ⭐ ШАГ 2.1: Очистка пронумерованных папок Video и Previews (НЕОБРАТИМО!)
        // Очистка папки Video
        try {
            var videoInputPath = UI_GETTERS.videoInputPath();
            var resolvedVideoPath = resolvePath(videoInputPath);
            log("🎬 Очистка Video (введён): " + videoInputPath, "INFO");
            log("🎬 Разрешённый путь Video: " + resolvedVideoPath, "INFO");
            $.writeln("[Clear Project] Video - введён: " + videoInputPath);
            $.writeln("[Clear Project] Video - разрешён: " + resolvedVideoPath);
            
            if (videoInputPath && videoInputPath !== "") {
                var videoResult = clearNumberedFolders(videoInputPath, "Video", 3, /^\d{3,4}$/);
                log("✅ Результат очистки Video: " + (videoResult ? "успешно" : "ошибка"), 
                    videoResult ? "SUCCESS" : "ERROR");
                $.writeln("[Clear Project] Video - результат: " + (videoResult ? "успешно" : "ошибка"));
            }
        } catch (e) {
            log("❌ Ошибка очистки Video: " + e.message, "ERROR");
            $.writeln("[Clear Project] Video - ОШИБКА: " + e.message);
        }
        
        // Очистка папки Previews  
        try {
            var videoOutputPath = UI_GETTERS.videoOutputPath();
            var resolvedPreviewsPath = resolvePath(videoOutputPath);
            log("📹 Очистка Previews (введён): " + videoOutputPath, "INFO");
            log("📹 Разрешённый путь Previews: " + resolvedPreviewsPath, "INFO");
            $.writeln("[Clear Project] Previews - введён: " + videoOutputPath);
            $.writeln("[Clear Project] Previews - разрешён: " + resolvedPreviewsPath);
            
            if (videoOutputPath && videoOutputPath !== "") {
                var previewsResult = clearNumberedFolders(videoOutputPath, "Previews", 3, /^\d+$/);
                log("✅ Результат очистки Previews: " + (previewsResult ? "успешно" : "ошибка"),
                    previewsResult ? "SUCCESS" : "ERROR");
                $.writeln("[Clear Project] Previews - результат: " + (previewsResult ? "успешно" : "ошибка"));
            }
        } catch (e) {
            log("❌ Ошибка очистки Previews: " + e.message, "ERROR");
            $.writeln("[Clear Project] Previews - ОШИБКА: " + e.message);
        }
        
        if (cleanupSuccess) {
            // ⭐ ШАГ 3: Инициализируем данные для восстановления ПЕРЕД очисткой
            g_clearUndoData = {
                backupPath: resolvedBackupPath,
                workPath: resolvedFolderPath
            };
            
            // ⭐ ШАГ 4: Операции в AE (ВНУТРИ undo-группы - отменяются через Ctrl+Z)
            // clearProjectFolder сохранит данные о видео в g_clearUndoData
            clearMeteoImageLayers();
            clearProjectFolder();
            renameAndSortMasks();
            
            // Проверяем результат
            var finalCheck = new Folder(resolvedFolderPath);
            var filesAfterCleanup = finalCheck.getFiles ? finalCheck.getFiles().length : 0;
            
            if (filesAfterCleanup === 0) {
                alert("✅ Очистка завершена успешно!\n\nВсе файлы удалены через системные команды.\n\nДля восстановления файлов нажмите '↶ Restore Files'");
                log("Очистка завершена успешно", "SUCCESS");
            } else {
                alert("⚠️ Частичный успех\n\nОсталось файлов: " + filesAfterCleanup + "\n\nВозможно, некоторые файлы заблокированы системой.\n\nДля восстановления файлов нажмите '↶ Restore Files'");
                log("Осталось файлов после очистки: " + filesAfterCleanup, "WARNING");
            }
        } else {
            alert("❌ Очистка не удалась\n\nПопробуйте вручную открыть папку в Explorer и запустить очистку снова.");
            log("Очистка не удалась", "ERROR");
        }
        
        return cleanupSuccess;
        
    } catch (e) {
        log("Ошибка в Clear Project: " + e.message, "ERROR");
        alert("❌ Ошибка: " + e.message);
        return false;
    } finally {
        app.endUndoGroup(); // ⭐ ГАРАНТИРОВАННО закрываем undo-группу
    }
}

// === ОБРАБОТЧИК ВОССТАНОВЛЕНИЯ ФАЙЛОВ ИЗ MAPS.BAK ===
btnRestoreFiles.onClick = function() {
    app.beginUndoGroup("Restore Files from Backup");
    
    try {
        if (!g_clearUndoData) {
            alert("Нет данных для восстановления!\n\nСначала выполните 'Clear Project'.");
            return false;
        }
        
        log("=== ВОССТАНОВЛЕНИЕ ФАЙЛОВ ИЗ MAPS.BAK ===", "INFO");
        
        var backupFolder = new Folder(g_clearUndoData.backupPath);
        var workFolder = new Folder(g_clearUndoData.workPath);
        
        if (!backupFolder.exists) {
            alert("❌ Папка бэкапа не найдена: " + g_clearUndoData.backupPath);
            log("Папка бэкапа не существует: " + g_clearUndoData.backupPath, "ERROR");
            return false;
        }
        
        // Создаем рабочую папку, если не существует
        if (!workFolder.exists) {
            workFolder.create();
            log("Создана рабочая папка: " + g_clearUndoData.workPath, "INFO");
        }
        
        // Копируем файлы из бэкапа обратно в рабочую папку
        var files = backupFolder.getFiles();
        var copiedCount = 0;
        var errorCount = 0;
        
        for (var i = 0; i < files.length; i++) {
            try {
                if (files[i] instanceof File) {
                    var destFile = new File(g_clearUndoData.workPath + "/" + files[i].name);
                    files[i].copy(destFile);
                    copiedCount++;
                    log("Восстановлен файл: " + files[i].name, "INFO");
                }
            } catch (e) {
                errorCount++;
                log("Ошибка при восстановлении файла '" + files[i].name + "': " + e.message, "WARNING");
            }
        }
        
        if (copiedCount > 0) {
            alert("✅ Восстановлено файлов: " + copiedCount + (errorCount > 0 ? "\n\nОшибок: " + errorCount : ""));
            log("Восстановлено файлов: " + copiedCount + ", ошибок: " + errorCount, "SUCCESS");
        } else {
            alert("⚠️ Файлы для восстановления не найдены в Maps.BAK");
            log("Файлы для восстановления не найдены", "WARNING");
        }
        
        // Очищаем данные восстановления
        g_clearUndoData = null;
        
        return copiedCount > 0;
        
    } catch (e) {
        log("Ошибка при восстановлении файлов: " + e.message, "ERROR");
        alert("❌ Ошибка восстановления: " + e.message);
        return false;
    } finally {
        app.endUndoGroup();
    }
}

// === УНИВЕРСАЛЬНОЕ РЕШЕНИЕ ===
function universalCleanup(folderPath, backupPath) {
    return safeExecute("universalCleanup", function() {
        var resolvedFolderPath = resolvePath(folderPath);
        var resolvedBackupPath = resolvePath(backupPath);
        
        log("Универсальная очистка запущена", "INFO");
        log("Основная папка: " + resolvedFolderPath, "INFO");
        log("Папка бэкапа: " + resolvedBackupPath, "INFO");
        
        // Сначала пробуем стандартный метод (для совместимости)
        var standardResult = standardCleanup(resolvedFolderPath, resolvedBackupPath);
        
        if (standardResult) {
            return true;
        }
        
        // Если стандартный метод не сработал, пробуем командную строку
        log("Стандартный метод не сработал, пробуем командную строку", "WARNING");
        return cleanupWithDirectCommands(resolvedFolderPath, resolvedBackupPath);
    }, []);
}

/**
 * Очистка через прямые команды CMD (если стандартный метод не сработал)
 * @param {String} folderPath - путь к основной папке (Maps.Work)
 * @param {String} backupPath - путь к папке бэкапа (Maps.BAK)
 * @returns {Boolean} true если очистка успешна
 */
function cleanupWithDirectCommands(folderPath, backupPath) {
    return safeExecute("cleanupWithDirectCommands", function() {
        log("=== ОЧИСТКА ЧЕРЕЗ CMD/БАТНИК ===", "INFO");
        
        // ВАЖНО: Сначала очищаем папку Maps.BAK ДО копирования
        log("Очистка папки Maps.BAK перед копированием", "INFO");
        var backupCleared = clearFolder(backupPath, "Maps.BAK");
        if (!backupCleared) {
            log("Предупреждение: не удалось полностью очистить папку Maps.BAK", "WARNING");
        }
        
        // Создаем папку Maps.BAK если нужно
        var backupFolder = new Folder(backupPath);
        if (!backupFolder.exists) {
            backupFolder.create();
            log("Создана папка Maps.BAK: " + backupPath, "INFO");
        }
        
        // Копируем файлы через CMD
        var folder = new Folder(folderPath);
        if (!folder.exists) {
            log("Основная папка не существует", "INFO");
            return true;
        }
        
        var files = folder.getFiles();
        if (files.length === 0) {
            log("Папка Maps.Work пуста, нечего копировать", "INFO");
            return true;
        }
        
        // Создаем батник для копирования и очистки
        var scriptFile = new File($.fileName);
        var scriptFolder = scriptFile.parent;
        var tempBatFile = new File(scriptFolder.fsName + "/temp_cleanup.bat");
        
        // ⭐ БЕЗОПАСНАЯ НОРМАЛИЗАЦИЯ И ВАЛИДАЦИЯ ПУТЕЙ
        // Проверяем, что пути находятся внутри проекта и не содержат опасных символов
        var normalizedFolderPath = normalizeAndValidatePath(folderPath);
        var normalizedBackupPath = normalizeAndValidatePath(backupPath);
        
        // Проверяем существование папок перед операциями
        var folder = new Folder(normalizedFolderPath);
        if (!folder.exists) {
            log("Основная папка не существует: " + normalizedFolderPath, "INFO");
            return true;
        }
        
        // ⭐ БЕЗОПАСНОЕ ЭКРАНИРОВАНИЕ ПУТЕЙ для предотвращения выполнения произвольного кода
        // escapePath возвращает путь в кавычках, но для set "VAR=value" нужен путь без внешних кавычек
        var escapedFolderPath = normalizedFolderPath.replace(/"/g, '""');
        var escapedBackupPath = normalizedBackupPath.replace(/"/g, '""');
        
        // ⭐ Улучшенные команды BAT (удаление всех файлов, включая без расширений)
        var batContent = [
            '@echo off',
            'setlocal EnableDelayedExpansion',
            'set "SRC=' + escapedFolderPath + '"',
            'set "BACKUP=' + escapedBackupPath + '"',
            '',
            ':: Очищаем BACKUP полностью (все файлы и папки)',
            'if exist "%BACKUP%\\*" (',
            '    cd /d "%BACKUP%"',
            '    del /f /q /a *.* 2>nul',
            '    del /f /q /a * 2>nul',
            '    for /d %%D in (*) do rd /s /q "%%D" 2>nul',
            ')',
            '',
            ':: Копируем SRC → BACKUP (все файлы и папки рекурсивно)',
            'xcopy /y /q /e /i "%SRC%\\*" "%BACKUP%\\" 2>nul',
            '',
            ':: Удаляем SRC с повторными попытками (все файлы и папки)',
            ':retry',
            'cd /d "%SRC%"',
            'set "hasFiles=0"',
            ':: Удаляем все файлы (с расширениями и без)',
            'del /f /q /a *.* 2>nul',
            'del /f /q /a * 2>nul',
            ':: Удаляем все папки',
            'for /d %%D in (*) do (',
            '    rd /s /q "%%D" 2>nul',
            '    if exist "%%D" set "hasFiles=1"',
            ')',
            ':: Проверяем, остались ли файлы',
            'for %%F in (*) do set "hasFiles=1"',
            'if "!hasFiles!"=="1" (timeout /t 1 >nul & goto retry)',
            '',
            'exit /b 0'
        ].join('\n');
        
        tempBatFile.open("w");
        tempBatFile.write(batContent);
        tempBatFile.close();
        
        log("Создан временный батник для очистки: " + tempBatFile.fsName, "INFO");
        
        // Проверяем существование файла перед выполнением
        if (!tempBatFile.exists) {
            throw new Error("BAT-файл не был создан: " + tempBatFile.fsName);
        }
        
        // Запускаем BAT файл
        tempBatFile.execute();
        
        // Даем время на выполнение (5 секунд для очистки)
        $.sleep(5000);
        
        // Удаляем временной batник
        try {
            if (tempBatFile.exists) {
                tempBatFile.remove();
            }
        } catch (e) {
            log("Не удалось удалить временный батник: " + e.message, "WARNING");
        }
        
        // Убеждаемся, что папка пуста
        var checkFolder = new Folder(folderPath);
        var remainingFiles = checkFolder.getFiles();
        var copiedFiles = backupFolder.getFiles();
        
        log("Скопировано файлов в Maps.BAK: " + copiedFiles.length, "INFO");
        log("Осталось файлов в Maps.Work: " + remainingFiles.length, remainingFiles.length === 0 ? "SUCCESS" : "WARNING");
        
        if (remainingFiles.length > 0) {
            throw new Error("Cleanup incomplete: files remain in Maps.Work");
        }
        
        return true;
    }, []);
}

/**
 * Очищает папку (удаляет все файлы)
 * Сначала пытается стандартным методом, если не получается - через CMD/батник
 * @param {String} folderPath - путь к папке для очистки
 * @param {String} folderName - имя папки для логов
 * @returns {Boolean} true если очистка успешна
 */
function clearFolder(folderPath, folderName) {
    return safeExecute("clearFolder", function() {
        try {
            var folder = new Folder(folderPath);
            
            if (!folder.exists) {
                log("Папка '" + folderName + "' не существует: " + folderPath, "INFO");
                return true; // Папки нет - считаем очистку успешной
            }
            
            // Пробуем стандартный метод очистки
            var files = folder.getFiles();
            var clearedCount = 0;
            
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                if (file instanceof File) {
                    try {
                        if (file.remove()) {
                            clearedCount++;
                        }
                    } catch (e) {
                        log("Не удалось удалить файл стандартным методом: " + file.name + " - " + e.message, "WARNING");
                    }
                }
            }
            
            log("Удалено файлов из '" + folderName + "' стандартным методом: " + clearedCount + " из " + files.length, "INFO");
            
            // Проверяем, остались ли файлы
            var remainingFiles = folder.getFiles();
            if (remainingFiles.length > 0) {
                log("Стандартный метод не удалил все файлы. Осталось: " + remainingFiles.length + ". Пробуем через CMD", "WARNING");
                return clearFolderWithCMD(folderPath, folderName);
            }
            
            return true;
            
        } catch (e) {
            log("Ошибка при стандартной очистке папки '" + folderName + "': " + e.message, "WARNING");
            // Пробуем через CMD
            return clearFolderWithCMD(folderPath, folderName);
        }
    }, []);
}

/**
 * Очищает папку через CMD/батник
 * @param {String} folderPath - путь к папке для очистки
 * @param {String} folderName - имя папки для логов
 * @returns {Boolean} true если очистка успешна
 */
function clearFolderWithCMD(folderPath, folderName) {
    return safeExecute("clearFolderWithCMD", function() {
        try {
            // Создаем временный батник для очистки
            var scriptFile = new File($.fileName);
            var scriptFolder = scriptFile.parent;
            var tempBatFile = new File(scriptFolder.fsName + "/temp_clear_" + folderName.replace(/\s+/g, "_") + ".bat");
            
            // ⭐ БЕЗОПАСНАЯ НОРМАЛИЗАЦИЯ И ВАЛИДАЦИЯ ПУТИ
            // Проверяем, что путь находится внутри проекта и не содержит опасных символов
            var normalizedPath = normalizeAndValidatePath(folderPath);
            
            // Проверяем существование папки перед операциями
            var folder = new Folder(normalizedPath);
            if (!folder.exists) {
                log("Папка '" + folderName + "' не существует: " + normalizedPath, "INFO");
                return true; // Папки нет - считаем очистку успешной
            }
            
            // ⭐ БЕЗОПАСНОЕ ЭКРАНИРОВАНИЕ ПУТИ для предотвращения выполнения произвольного кода
            // Используем нормализованный путь и экранируем кавычки для set "VAR=value"
            var escapedPath = normalizedPath.replace(/"/g, '""');
            
            // Создаем батник с командами очистки
            // Используем set "VAR=value" для безопасного присвоения пути
            var batContent = "@echo off\n";
            batContent += "setlocal EnableDelayedExpansion\n";
            batContent += 'set "TARGET=' + escapedPath + '"\n';
            batContent += 'if not exist "%TARGET%\\" (\n';
            batContent += '    echo ERROR: Folder not found: %TARGET%\n';
            batContent += '    exit /b 1\n';
            batContent += ')\n';
            batContent += 'cd /d "%TARGET%"\n';
            batContent += 'if exist "*.*" del /q /f "*.*"\n';
            batContent += "exit /b 0\n";
            
            tempBatFile.open("w");
            tempBatFile.write(batContent);
            tempBatFile.close();
            
            log("Создан временный батник для очистки '" + folderName + "': " + tempBatFile.fsName, "INFO");
            
            // Проверяем существование файла перед выполнением
            if (!tempBatFile.exists) {
                throw new Error("BAT-файл не был создан: " + tempBatFile.fsName);
            }
            
            // Запускаем BAT файл
            tempBatFile.execute();
            
            // Даем время на выполнение (5 секунд для очистки)
            $.sleep(5000);
            
            // Удаляем временный batник
            try {
                if (tempBatFile.exists) {
                    tempBatFile.remove();
                }
            } catch (e) {
                log("Не удалось удалить временный батник: " + e.message, "WARNING");
            }
            
            // Проверяем результат
            var folder = new Folder(folderPath);
            var remainingFiles = folder.getFiles();
            
            if (remainingFiles.length === 0) {
                log("Папка '" + folderName + "' успешно очищена через CMD", "SUCCESS");
                return true;
            } else {
                log("После очистки через CMD в папке '" + folderName + "' осталось файлов: " + remainingFiles.length, "WARNING");
                return false;
            }
            
        } catch (e) {
            log("Ошибка при очистке папки '" + folderName + "' через CMD: " + e.message, "ERROR");
            return false;
        }
    }, []);
}

/**
 * Очищает пронумерованные папки, оставляя только N последних по индексу
 * НЕОБРАТИМАЯ операция - выполняется через BAT-файл
 * @param {String} baseFolderPath - путь к базовой папке (Video или Previews)
 * @param {String} folderName - имя папки для логов
 * @param {Number} keepCount - количество последних папок для сохранения (по умолчанию 3)
 * @param {RegExp} folderPattern - регулярное выражение для поиска пронумерованных папок (по умолчанию /^\d+$/)
 * @returns {Boolean} true если очистка успешна
 */
function clearNumberedFolders(baseFolderPath, folderName, keepCount, folderPattern) {
    keepCount = keepCount || 3;
    folderPattern = folderPattern || /^\d+$/;
    
    try {
        // ⭐ ИСПРАВЛЕНИЕ: Используем стандартный resolvePath() для всех путей
        var resolvedPath = resolvePath(baseFolderPath);
        
        // 🔍 ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ ДЛЯ ОТЛАДКИ
        log("🧹 Очистка папки: " + folderName + " (введён: " + baseFolderPath + ")", "INFO");
        log("🧹 Разрешённый путь: " + resolvedPath, "INFO");
        $.writeln("[clearNumberedFolders] " + folderName + " - ВХОД: baseFolderPath = " + baseFolderPath);
        $.writeln("[clearNumberedFolders] " + folderName + " - ПОСЛЕ resolvePath(): resolvedPath = " + resolvedPath);
        
        // Проверяем, что resolvedPath не содержит /AE/ (папка AE только для .aep файлов)
        if (resolvedPath.indexOf("/AE/") >= 0) {
            log("⚠️ ВНИМАНИЕ: resolvedPath содержит /AE/ - это может быть ошибкой!", "WARNING");
            $.writeln("[clearNumberedFolders] ⚠️ ВНИМАНИЕ: resolvedPath содержит /AE/!");
        }
        
        // Простая проверка существования папки
        var targetFolder = new Folder(resolvedPath);
        if (!targetFolder.exists) {
            log("❌ Папка не существует: " + resolvedPath, "ERROR");
            $.writeln("[clearNumberedFolders] " + folderName + " - ОШИБКА: папка не существует!");
            return false;
        }
        
        $.writeln("[clearNumberedFolders] " + folderName + " - папка существует: " + resolvedPath);
        
        // Получаем список папок
        var folders = targetFolder.getFiles();
        var numberedFolders = [];
        
        for (var i = 0; i < folders.length; i++) {
            var folder = folders[i];
            if (folder instanceof Folder && folderPattern.test(folder.name)) {
                var folderNumber = parseInt(folder.name);
                if (!isNaN(folderNumber)) {
                    numberedFolders.push({
                        name: folder.name,
                        number: folderNumber
                    });
                }
            }
        }
        
        if (numberedFolders.length === 0) {
            log("ℹ️ Не найдено пронумерованных папок в " + resolvedPath, "INFO");
            return true;
        }
        
        if (numberedFolders.length <= keepCount) {
            log("ℹ️ Папок меньше или равно " + keepCount + ", удаление не требуется", "INFO");
            return true;
        }
        
        // Сортируем и определяем для удаления
        numberedFolders.sort(function(a, b) { return a.number - b.number; });
        var foldersToDelete = numberedFolders.slice(0, numberedFolders.length - keepCount);
        
        log("📊 Статистика " + folderName + ": всего " + numberedFolders.length + 
            ", удаляем " + foldersToDelete.length + 
            ", оставляем " + keepCount, "INFO");
        
        // ⭐ ИСПРАВЛЕНИЕ: Используем ту же логику создания BAT-файла что и в работающем коде
        var scriptFile = new File($.fileName);
        var scriptFolder = scriptFile.parent;
        var tempBatFile = new File(scriptFolder.fsName + "/temp_clear_" + folderName + ".bat");
        
        // ⭐ ИСПРАВЛЕНИЕ: Простая нормализация пути (как в работающем коде)
        var windowsPath = resolvedPath.replace(/\//g, '\\');
        // Проверяем окончание пути (ExtendScript не поддерживает endsWith)
        if (windowsPath.length > 0 && windowsPath.charAt(windowsPath.length - 1) !== '\\') {
            windowsPath += '\\';
        }
        
        // Экранируем кавычки для BAT (как в работающем коде)
        var batPath = windowsPath.replace(/"/g, '""');
        
        // ⭐ ИСПРАВЛЕНИЕ: BAT-код аналогичный работающему (упрощенный)
        var batContent = [
            '@echo off',
            'setlocal enabledelayedexpansion',
            '',
            'set "target_dir=' + batPath + '"',
            'set "keep_count=' + keepCount + '"',
            '',
            'echo [INFO] Cleaning ' + folderName + ' folders in: !target_dir!',
            '',
            ':: Get and sort numbered folders',
            'set "temp_file=%temp%\\folders_list_%random%.txt"',
            'dir /b /ad "!target_dir!" | findstr /r "^[0-9][0-9]*$" > "!temp_file!"',
            'powershell -Command "Get-Content \'!temp_file!\' | Sort-Object {[int]$_} -Descending" > "!temp_file!.sorted"',
            '',
            'set /a counter=0',
            'for /f "usebackq delims=" %%A in ("!temp_file!.sorted") do (',
            '  set /a counter+=1',
            '  if !counter! leq !keep_count! (',
            '    echo [KEEP] %%A',
            '  ) else (',
            '    echo [DELETE] %%A',
            '    rmdir /s /q "!target_dir!%%A"',
            '  )',
            ')',
            '',
            'del "!temp_file!" >nul 2>&1',
            'del "!temp_file!.sorted" >nul 2>&1',
            'echo [INFO] ' + folderName + ' cleanup completed.',
            'exit /b 0'
        ].join('\n');
        
        // Записываем BAT-файл
        tempBatFile.open("w");
        tempBatFile.write(batContent);
        tempBatFile.close();
        
        log("📄 Создан BAT-файл: " + tempBatFile.fsName, "DEBUG");
        $.writeln("[clearNumberedFolders] " + folderName + " - BAT-файл создан: " + tempBatFile.fsName);
        
        // Запускаем BAT-файл
        log("🚀 Запуск BAT-файла для очистки " + folderName, "INFO");
        $.writeln("[clearNumberedFolders] " + folderName + " - запуск BAT-файла");
        
        // Проверяем существование файла перед выполнением
        if (!tempBatFile.exists) {
            throw new Error("BAT-файл не был создан: " + tempBatFile.fsName);
        }
        
        // Запускаем BAT файл
        tempBatFile.execute();
        
        log("🚀 BAT-файл для " + folderName + " запущен", "INFO");
        $.writeln("[clearNumberedFolders] " + folderName + " - BAT-файл запущен");
        
        // Даем время на выполнение (5 секунд для очистки)
        $.sleep(5000);
        
        // Проверяем результат
        var finalCheck = new Folder(resolvedPath);
        var remainingFolders = finalCheck.getFiles().filter(function(f) {
            return f instanceof Folder && folderPattern.test(f.name);
        });
        
        var success = remainingFolders.length <= keepCount;
        
        log("📊 После очистки " + folderName + ": " + remainingFolders.length + " папок осталось", 
            success ? "SUCCESS" : "WARNING");
        $.writeln("[clearNumberedFolders] " + folderName + " - после очистки осталось: " + remainingFolders.length);
        
        // Удаляем временный файл
        try {
            if (tempBatFile.exists) {
                tempBatFile.remove();
                log("🗑️ Временный BAT-файл для " + folderName + " удален", "DEBUG");
            }
        } catch (e) {
            log("⚠️ Не удалось удалить временный файл для " + folderName + ": " + e.message, "WARNING");
        }
        
        return success;
        
    } catch (e) {
        log("❌ Ошибка в clearNumberedFolders для " + folderName + ": " + e.message, "ERROR");
        $.writeln("[clearNumberedFolders] " + folderName + " - ОШИБКА: " + e.message);
        return false;
    }
}

function standardCleanup(folderPath, backupPath) {
    return safeExecute("standardCleanup", function() {
        try {
            var folder = new Folder(folderPath);
            var backupFolder = new Folder(backupPath);
            
            if (!folder.exists) {
                log("Основная папка не существует", "INFO");
                return true;
            }
            
            // ВАЖНО: Сначала очищаем папку Maps.BAK ДО копирования
            log("=== ОЧИСТКА ПАПКИ MAPS.BAK ПЕРЕД КОПИРОВАНИЕМ ===", "INFO");
            var backupCleared = clearFolder(backupPath, "Maps.BAK");
            if (!backupCleared) {
                log("Предупреждение: не удалось полностью очистить папку Maps.BAK", "WARNING");
            }
            
            // Создаем бэкап папку если нужно (после очистки)
            if (!backupFolder.exists) {
                backupFolder.create();
                log("Создана папка Maps.BAK: " + backupPath, "INFO");
            }
            
            // Копируем файлы
            var files = folder.getFiles();
            var copiedCount = 0;
            
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                if (file instanceof File) {
                    var destFile = new File(backupPath + "/" + file.name);
                    try {
                    file.copy(destFile);
                    copiedCount++;
                    } catch (e) {
                        log("Ошибка при копировании файла '" + file.name + "': " + e.message, "WARNING");
                    }
                }
            }
            
            log("Скопировано файлов стандартным методом: " + copiedCount, "INFO");
            
            // Очищаем основную папку Maps.Work
            log("=== ОЧИСТКА ПАПКИ MAPS.WORK ===", "INFO");
            var mainCleared = clearFolder(folderPath, "Maps.Work");
            if (!mainCleared) {
                log("Предупреждение: не удалось полностью очистить папку Maps.Work", "WARNING");
            }
            
            return copiedCount > 0 || files.length === 0;
            
        } catch (e) {
            log("Стандартный метод очистки не сработал: " + e.message, "WARNING");
            return false;
        }
    }, []);
}




function clearMeteoImageLayers() {    
    return safeExecute("clearMeteoImageLayers", function() {
        var compName = ComposeName;
        var comp = findCompByName(compName);

        if (comp != null) {
            // ⭐ СОХРАНЯЕМ ДАННЫЕ О ВСЕХ СЛОЯХ METEОIMAGE ПЕРЕД УДАЛЕНИЕМ (для полного восстановления)
            var meteoImageLayersData = [];
            for (var i = comp.numLayers; i >= 1; i--) {
                try {
                    var layer = comp.layer(i);
                    if (!layer || !layer.name) {
                        continue;
                    }
                    // Ищем слои с форматом MeteoImage 01, MeteoImage 02 и т.д. (новый формат) или равны MeteoImage (старый формат)
                    var imagePattern = /^MeteoImage (\d{2})$/;
                    if (layer.name.match(imagePattern) || layer.name == LAYER_NAMES.METEO_IMAGE) {
                        // Сохраняем полные данные о слое перед удалением
                        var layerData = {
                            name: layer.name,
                            index: i,
                            inPoint: layer.inPoint,
                            outPoint: layer.outPoint,
                            enabled: layer.enabled,
                            audioEnabled: layer.audioEnabled,
                            source: null,
                            transform: {
                                position: layer.property("Position").value,
                                scale: layer.property("Scale").value,
                                rotation: layer.property("Rotation").value,
                                opacity: layer.property("Opacity").value
                            }
                        };
                        
                        // Сохраняем информацию об источнике
                        if (layer.source) {
                            if (layer.source.file) {
                                layerData.source = {
                                    filePath: layer.source.file.fsName,
                                    name: layer.source.name,
                                    itemId: layer.source.id // ID элемента в проекте для поиска после восстановления
                                };
                            } else if (layer.source.name) {
                                layerData.source = {
                                    name: layer.source.name,
                                    itemId: layer.source.id
                                };
                            }
                        }
                        
                        meteoImageLayersData.push(layerData);
                    }
                } catch (e) {
                    log("Ошибка при сохранении данных слоя " + i + ": " + e.message, "WARNING");
                    continue;
                }
            }
            
            // Сохраняем данные в g_clearUndoData
            if (!g_clearUndoData) {
                g_clearUndoData = {};
            }
            g_clearUndoData.meteoImageLayersData = meteoImageLayersData;
            log("Сохранено данных о слоях MeteoImage: " + meteoImageLayersData.length, "INFO");
            
            // Удаляем слои
            var removedCount = 0;
            for (var i = comp.numLayers; i >= 1; i--) {
                try {
                    var layer = comp.layer(i);
                    if (!layer || !layer.name) {
                        continue;
                    }
                    var imagePattern = /^MeteoImage (\d{2})$/;
                    if (layer.name.match(imagePattern) || layer.name == LAYER_NAMES.METEO_IMAGE) {
                        layer.remove();
                        removedCount++;
                    }
                } catch (e) {
                    log("Ошибка при удалении слоя " + i + ": " + e.message, "WARNING");
                    continue;
                }
            }
            comp.openInViewer();
            log("Удалено слоев MeteoImage: " + removedCount, "INFO");
            return true;
        } else {
            throw new Error("Композиция с именем " + compName + " не найдена.");
        }
    }, []);
}

/**
 * Переименовывает и сортирует маски в композиции "MeteoCalendar Main Comp"
 * 1. Сортирует маски так, чтобы их индексация была строго друг за другом
 * 2. Выше всех масок должен быть слой Video
 * 3. Переименовывает в "MeteoMask 01", "MeteoMask 02" и т.д.
 * 4. Нумерация строго снизу вверх и слева направо по хрону (самый последний индекс, самый ранний инпоинт - самая первая маска)
 */
function renameAndSortMasks() {
    return safeExecute("renameAndSortMasks", function() {
        log("=== НАЧАЛО renameAndSortMasks ===", "INFO");
        
        var compName = ComposeName;
        var comp = findCompByName(compName);
        
        if (!comp) {
            log("Композиция '" + compName + "' не найдена", "WARNING");
            return false;
        }
        
        // ⭐ ИЗМЕНЕНО: Используем isValidMaskLayer вместо простой проверки по имени и label
        // Находим папку Transitions
        var transitionsFolder = findProjectFolder("Transitions");
        
        // Собираем все маски (композиция, в папке Transitions, имя содержит "Mask")
        var masks = [];
        var videoLayer = null;
        
        // ⭐ ИЗМЕНЕНО: Находим папку VideoSrc для правильного поиска слоя Video
        var videoSrcFolder = findProjectFolder("VideoSrc");
        
        log("Папка VideoSrc найдена: " + (videoSrcFolder ? "да" : "нет"), "INFO");
        
        // ⭐ ИЗМЕНЕНО: Сначала ищем Video по имени (с учетом регистра и без учета регистра)
        // Затем проверяем, является ли он композицией и находится ли в папке VideoSrc
        for (var i = 1; i <= comp.numLayers; i++) {
            try {
                var layer = comp.layer(i);
                // Проверяем имя слоя (с учетом регистра и без)
                var layerNameMatches = (layer.name === LAYER_NAMES.VIDEO || layer.name.toUpperCase() === LAYER_NAMES.VIDEO.toUpperCase());
                
                if (layerNameMatches && layer.source instanceof CompItem) {
                    log("Найден слой с именем '" + layer.name + "' (ожидалось '" + LAYER_NAMES.VIDEO + "'), проверяем папку VideoSrc...", "INFO");
                    if (videoSrcFolder) {
                        if (layer.source.parentFolder === videoSrcFolder) {
                            videoLayer = layer;
                            log("✅ Слой Video найден и подтвержден (в папке VideoSrc, index: " + layer.index + ")", "INFO");
                        } else {
                            log("⚠️ Слой '" + layer.name + "' найден, но его source не в папке VideoSrc. parentFolder: " + (layer.source.parentFolder ? layer.source.parentFolder.name : "null"), "WARNING");
                            // ⭐ Если папка VideoSrc не совпадает, но слой называется VIDEO и является CompItem, используем его
                            if (!videoLayer) {
                                videoLayer = layer;
                                log("⚠️ Используем слой '" + layer.name + "' как Video (без проверки папки VideoSrc)", "WARNING");
                            }
                        }
                    } else {
                        log("⚠️ Папка VideoSrc не найдена в проекте, используем слой '" + layer.name + "' как Video", "WARNING");
                        // ⭐ Если папка VideoSrc не найдена, но слой называется VIDEO и является CompItem, используем его
                        if (!videoLayer) {
                            videoLayer = layer;
                        }
                    }
                } else if (layerNameMatches) {
                    log("⚠️ Найден слой с именем '" + layer.name + "', но его source не является CompItem. source: " + (layer.source ? layer.source.constructor.name : "null"), "WARNING");
                } else {
                    // ⭐ ИЗМЕНЕНО: Ищем маски по базовым признакам (композиция, в папке Transitions), независимо от имени
                    // isValidMaskLayer автоматически исправит label, если он неправильный
                    if (isValidMaskLayer(layer, transitionsFolder)) {
                        masks.push(layer);
                    }
                }
            } catch (e) {
                continue;
            }
        }
        
        log("Найдено масок: " + masks.length, "INFO");
        log("Найден слой Video: " + (videoLayer ? "да (index: " + videoLayer.index + ", name: '" + videoLayer.name + "')" : "нет"), "INFO");
        
        if (!videoLayer) {
            log("⚠️ ВНИМАНИЕ: Слой Video не найден! Ищем все слои с именем, содержащим 'VIDEO' или 'Video' для диагностики:", "WARNING");
            var foundVideoLayers = [];
            for (var di = 1; di <= comp.numLayers; di++) {
                try {
                    var dlayer = comp.layer(di);
                    var nameUpper = dlayer.name.toUpperCase();
                    if (nameUpper.indexOf("VIDEO") !== -1) {
                        foundVideoLayers.push({
                            name: dlayer.name,
                            index: dlayer.index,
                            source: dlayer.source ? (dlayer.source instanceof CompItem ? "CompItem '" + dlayer.source.name + "'" : dlayer.source.constructor.name) : "null",
                            parentFolder: (dlayer.source instanceof CompItem && dlayer.source.parentFolder) ? dlayer.source.parentFolder.name : "null"
                        });
                    }
                } catch (e) {
                    continue;
                }
            }
            if (foundVideoLayers.length > 0) {
                for (var fvi = 0; fvi < foundVideoLayers.length; fvi++) {
                    var fv = foundVideoLayers[fvi];
                    log("  Найден слой '" + fv.name + "' (index: " + fv.index + "), source: " + fv.source + ", parentFolder: " + fv.parentFolder, "WARNING");
                }
            } else {
                log("  Слои с именем, содержащим 'VIDEO', не найдены", "WARNING");
            }
        }
        
        if (masks.length === 0) {
            log("Маски не найдены", "WARNING");
            return false;
        }
        
        // Сортируем маски по inPoint (самый ранний inPoint = первая маска)
        // Если inPoint совпадают, сортируем по индексу (больший индекс = выше в таймлайне)
        masks.sort(function(a, b) {
            var aPoint = a.inPoint !== undefined && a.inPoint !== null ? a.inPoint : 0;
            var bPoint = b.inPoint !== undefined && b.inPoint !== null ? b.inPoint : 0;
            if (Math.abs(aPoint - bPoint) < LAYER_CONFIG.TIME_PRECISION) {
                // Если inPoint совпадают, сортируем по индексу (больший индекс = выше)
                return b.index - a.index;
            }
            return aPoint - bPoint;
        });
        
        log("Маски отсортированы по inPoint", "INFO");
        
        // ⭐ Переименовываем маски в порядке сортировки (независимо от исходных имен)
        // ⭐ ВАЖНО: Сохраняем старые номера масок для связи с картинками
        var oldMaskNumbers = {}; // oldName -> oldNumber
        for (var m = 0; m < masks.length; m++) {
            var mask = masks[m];
            var maskNumber = m + 1;
            var oldName = mask.name; // Сохраняем старое имя для логирования
            var oldNumber = getMaskNumber(oldName); // Сохраняем старый номер для связи с картинкой
            if (oldNumber !== null) {
                oldMaskNumbers[oldName] = oldNumber;
            }
            var newName = LAYER_NAMES.METEO_MASK + " " + (maskNumber < 10 ? "0" + maskNumber : maskNumber.toString());
            
            try {
                // Переименовываем только если имя отличается
                if (oldName !== newName) {
                    mask.name = newName;
                    log("Маска переименована: '" + oldName + "' -> '" + newName + "'", "INFO");
                } else {
                    log("Маска '" + oldName + "' уже имеет правильное имя", "INFO");
                }
            } catch (e) {
                log("Ошибка при переименовании маски '" + oldName + "': " + e.message, "WARNING");
            }
        }
        
        // ⭐ НОВОЕ: Собираем все картинки и связываем их с масками по номеру
        // Это нужно для того, чтобы перемещать картинки вместе с масками при сортировке
        // ⭐ ВАЖНО: Собираем картинки ПОСЛЕ переименования масок, но связываем по новым номерам
        // ⭐ КРИТИЧНО: Проверяем ВСЕ картинки (даже с неправильными именами), исправляем их и устанавливаем label 5
        var imagesByMaskNumber = {};
        for (var i = 1; i <= comp.numLayers; i++) {
            try {
                var layer = comp.layer(i);
                
                // ⭐ ПРОВЕРКА 1: Является ли слой картинкой (проверяем по source в Maps.Work или по имени)
                var isImageLayer = false;
                try {
                    // Проверяем, находится ли source в папке Maps.Work
                    if (isImageInMapsTemp(layer)) {
                        isImageLayer = true;
                    } else {
                        // Или проверяем по имени (может быть неправильное имя)
                        var imagePattern = /^MeteoImage (\d{2})$/;
                        if (layer.name.match(imagePattern)) {
                            isImageLayer = true;
                        }
                    }
                } catch (e) {
                    // Не картинка, пропускаем
                    continue;
                }
                
                if (!isImageLayer) continue;
                
                // ⭐ ПРОВЕРКА 2: Прилинкована ли картинка к маске
                var layerParent = null;
                try {
                    layerParent = layer.parent;
                } catch (e) {
                    // Если не можем получить parent - картинка неправильная, ставим label 1
                    try {
                        if (layer.label !== LAYER_CONFIG.IMAGE_INCORRECT_LABEL) {
                            layer.label = LAYER_CONFIG.IMAGE_INCORRECT_LABEL;
                            log("Установлен label " + LAYER_CONFIG.IMAGE_INCORRECT_LABEL + " для картинки '" + layer.name + "' (не удалось получить parent)", "INFO");
                        }
                    } catch (e2) {
                        // Игнорируем ошибку установки label
                    }
                    continue;
                }
                
                // Если не прилинкована к маске - картинка неправильная, ставим label 1
                if (!layerParent) {
                    try {
                        if (layer.label !== LAYER_CONFIG.IMAGE_INCORRECT_LABEL) {
                            layer.label = LAYER_CONFIG.IMAGE_INCORRECT_LABEL;
                            log("Установлен label " + LAYER_CONFIG.IMAGE_INCORRECT_LABEL + " для картинки '" + layer.name + "' (не прилинкована к маске)", "INFO");
                        }
                    } catch (e) {
                        // Игнорируем ошибку установки label
                    }
                    continue;
                }
                
                // Проверяем, является ли parent маской из нашего списка
                var parentMask = null;
                var parentMaskNum = null;
                for (var m = 0; m < masks.length; m++) {
                    if (masks[m] === layerParent) {
                        parentMask = masks[m];
                        parentMaskNum = getMaskNumber(parentMask.name);
                        break;
                    }
                }
                
                // Если parent не является маской - картинка неправильная, ставим label 1
                if (!parentMask || parentMaskNum === null) {
                    try {
                        if (layer.label !== LAYER_CONFIG.IMAGE_INCORRECT_LABEL) {
                            layer.label = LAYER_CONFIG.IMAGE_INCORRECT_LABEL;
                            log("Установлен label " + LAYER_CONFIG.IMAGE_INCORRECT_LABEL + " для картинки '" + layer.name + "' (parent не является маской)", "INFO");
                        }
                    } catch (e) {
                        // Игнорируем ошибку установки label
                    }
                    continue;
                }
                
                // ⭐ ПРОВЕРКА 3: Проверяем все правила правильной картинки
                var hasTrackMatte = false;
                var correctName = getImageLayerName(parentMaskNum);
                var hasCorrectName = (layer.name === correctName);
                
                try {
                    hasTrackMatte = layer.hasTrackMatte;
                } catch (e) {
                    continue;
                }
                
                // ⭐ ПРАВИЛО: Картинка правильная, если прилинкована к маске И имеет track matte
                var isCorrectImage = (layerParent === parentMask && hasTrackMatte);
                
                if (isCorrectImage) {
                    // ⭐ ИСПРАВЛЕНИЕ 1: Переименовываем, если имя неправильное
                    if (!hasCorrectName) {
                        try {
                            var oldName = layer.name;
                            layer.name = correctName;
                            log("Картинка переименована: '" + oldName + "' -> '" + correctName + "' (прилинкована к маске " + parentMask.name + ")", "INFO");
                        } catch (e) {
                            log("Ошибка при переименовании картинки '" + layer.name + "': " + e.message, "WARNING");
                        }
                    }
                    
                    // ⭐ ИСПРАВЛЕНИЕ 2: Синхронизируем in/out point с маской-родителем
                    try {
                        var inPointMatch = Math.abs(layer.inPoint - parentMask.inPoint) < LAYER_CONFIG.TIME_PRECISION;
                        var outPointMatch = Math.abs(layer.outPoint - parentMask.outPoint) < LAYER_CONFIG.TIME_PRECISION;
                        
                        if (!inPointMatch || !outPointMatch) {
                            var oldInPoint = layer.inPoint;
                            var oldOutPoint = layer.outPoint;
                            layer.inPoint = parentMask.inPoint;
                            layer.outPoint = parentMask.outPoint;
                            log("Синхронизированы тайминги картинки '" + layer.name + "' с маской '" + parentMask.name + "': inPoint " + oldInPoint + "->" + parentMask.inPoint + ", outPoint " + oldOutPoint + "->" + parentMask.outPoint, "INFO");
                        }
                    } catch (e) {
                        log("Ошибка при синхронизации таймингов картинки '" + layer.name + "': " + e.message, "WARNING");
                    }
                    
                    // ⭐ ИСПРАВЛЕНИЕ 3: Устанавливаем label 5 для правильных картинок
                    try {
                        if (layer.label !== LAYER_CONFIG.IMAGE_LABEL) {
                            layer.label = LAYER_CONFIG.IMAGE_LABEL;
                            log("Установлен label " + LAYER_CONFIG.IMAGE_LABEL + " для правильной картинки '" + layer.name + "'", "INFO");
                        }
                    } catch (e) {
                        log("Ошибка при установке label для картинки '" + layer.name + "': " + e.message, "WARNING");
                    }
                    
                    // Связываем картинку с маской для сортировки
                    imagesByMaskNumber[parentMaskNum] = layer;
                    log("Картинка '" + layer.name + "' правильная (parent=" + parentMask.name + ", trackMatte=true) - связываем с маской для сортировки", "INFO");
                } else {
                    // ⭐ Картинка не отвечает минимальным требованиям - устанавливаем label 1
                    try {
                        if (layer.label !== LAYER_CONFIG.IMAGE_INCORRECT_LABEL) {
                            layer.label = LAYER_CONFIG.IMAGE_INCORRECT_LABEL;
                            log("Установлен label " + LAYER_CONFIG.IMAGE_INCORRECT_LABEL + " для неправильной картинки '" + layer.name + "' (не отвечает минимальным требованиям)", "INFO");
                        }
                    } catch (e) {
                        log("Ошибка при установке label " + LAYER_CONFIG.IMAGE_INCORRECT_LABEL + " для картинки '" + layer.name + "': " + e.message, "WARNING");
                    }
                    log("Картинка '" + layer.name + "' НЕ правильная (parent=" + (layerParent ? layerParent.name : "null") + ", trackMatte=" + hasTrackMatte + ") - НЕ связываем с маской, установлен label " + LAYER_CONFIG.IMAGE_INCORRECT_LABEL, "INFO");
                }
            } catch (e) {
                continue;
            }
        }
        log("Найдено правильных картинок для перемещения: " + Object.keys(imagesByMaskNumber).length, "INFO");
        
        // ⭐ ИЗМЕНЕНО: Исправляем порядок масок в таймлайне (даже если он был нарушен пользователем)
        // Правильный порядок:
        // 1. Маски отсортированы по inPoint (masks[0] = первая по времени, masks[masks.length-1] = последняя)
        // 2. В таймлайне должны быть расположены так:
        //    - Внизу (больший индекс) = masks[0] (первая по inPoint)
        //    - Вверху (меньший индекс) = masks[masks.length-1] (последняя по inPoint)
        // 3. Все маски должны быть ниже слоя Video
        // 4. Между масками не должно быть других слоев (кроме картинок под ними)
        
        if (videoLayer) {
            // Находим индекс слоя Video
            var videoIndex = videoLayer.index;
            log("Индекс слоя Video: " + videoIndex, "INFO");
            
            // ⭐ ИЗМЕНЕНО: Собираем все пары (маска + картинка) в правильном порядке
            // Последняя маска (masks[masks.length-1]) должна быть вверху (сразу после Video, меньший индекс)
            // Первая маска (masks[0]) должна быть внизу (больший индекс)
            var maskImagePairs = [];
            for (var mi = 0; mi < masks.length; mi++) {
                var mask = masks[mi];
                var maskNum = getMaskNumber(mask.name);
                var imageLayer = maskNum !== null ? imagesByMaskNumber[maskNum] : null;
                maskImagePairs.push({
                    mask: mask,
                    image: imageLayer,
                    index: mi // Сохраняем индекс для логирования
                });
            }
            
            // ⭐ ВАЖНО: Обновляем ссылку на Video перед перемещением
            var currentVideoLayer = null;
            for (var vi = 1; vi <= comp.numLayers; vi++) {
                try {
                    var layer = comp.layer(vi);
                    if (layer.name === LAYER_NAMES.VIDEO && layer.source instanceof CompItem) {
                        if (videoSrcFolder && layer.source.parentFolder === videoSrcFolder) {
                            currentVideoLayer = layer;
                            break;
                        }
                    }
                } catch (e) {
                    continue;
                }
            }
            
            if (!currentVideoLayer) {
                log("⚠️ Не удалось найти слой Video после переименования масок", "WARNING");
                currentVideoLayer = videoLayer;
            }
            
            log("Video найден на индексе: " + currentVideoLayer.index, "INFO");
            log("Всего пар для перемещения: " + maskImagePairs.length, "INFO");
            
            // ⭐ Перемещаем пары от последней к первой (сверху вниз)
            // Последняя пара размещается сразу после Video, каждая следующая - ниже предыдущей
            for (var pi = maskImagePairs.length - 1; pi >= 0; pi--) {
                var pair = maskImagePairs[pi];
                var mask = pair.mask;
                var imageLayer = pair.image;
                
                try {
                    // ⭐ Обновляем ссылку на Video перед каждым перемещением (на случай, если индекс изменился)
                    var videoRef = null;
                    for (var vi = 1; vi <= comp.numLayers; vi++) {
                        try {
                            var layer = comp.layer(vi);
                            if (layer.name === LAYER_NAMES.VIDEO && layer.source instanceof CompItem) {
                                if (videoSrcFolder && layer.source.parentFolder === videoSrcFolder) {
                                    videoRef = layer;
                                    break;
                                }
                            }
                        } catch (e) {
                            continue;
                        }
                    }
                    if (!videoRef) videoRef = currentVideoLayer;
                    
                    if (pi === maskImagePairs.length - 1) {
                        // Последняя пара - размещаем сразу после Video (вверху)
                        var maskIndexBefore = mask.index;
                        mask.moveAfter(videoRef);
                        var maskIndexAfter = mask.index;
                        log("Маска '" + mask.name + "' (последняя по inPoint, индекс в массиве: " + pair.index + ") перемещена сразу после Video. Индекс: " + maskIndexBefore + " -> " + maskIndexAfter, "INFO");
                        
                        if (imageLayer) {
                            var imageIndexBefore = imageLayer.index;
                            imageLayer.moveAfter(mask);
                            var imageIndexAfter = imageLayer.index;
                            log("Картинка '" + imageLayer.name + "' перемещена вместе с маской. Индекс: " + imageIndexBefore + " -> " + imageIndexAfter, "INFO");
                        }
                    } else {
                        // Остальные пары - размещаем ниже предыдущей
                        // Предыдущая пара (maskImagePairs[pi + 1]) уже размещена выше
                        var prevPair = maskImagePairs[pi + 1];
                        var prevImage = prevPair.image;
                        
                        var maskIndexBefore = mask.index;
                        // Перемещаем маску после картинки предыдущей пары (если есть), иначе после маски
                        if (prevImage) {
                            mask.moveAfter(prevImage);
                            log("Маска '" + mask.name + "' (индекс в массиве: " + pair.index + ") перемещена после картинки '" + prevImage.name + "' предыдущей пары. Индекс: " + maskIndexBefore + " -> " + mask.index, "INFO");
                        } else {
                            mask.moveAfter(prevPair.mask);
                            log("Маска '" + mask.name + "' (индекс в массиве: " + pair.index + ") перемещена после маски '" + prevPair.mask.name + "' предыдущей пары. Индекс: " + maskIndexBefore + " -> " + mask.index, "INFO");
                        }
                        
                        if (imageLayer) {
                            var imageIndexBefore = imageLayer.index;
                            imageLayer.moveAfter(mask);
                            log("Картинка '" + imageLayer.name + "' перемещена вместе с маской. Индекс: " + imageIndexBefore + " -> " + imageLayer.index, "INFO");
                        }
                    }
                } catch (e) {
                    log("Ошибка при перемещении пары (маска '" + mask.name + "'): " + e.message, "WARNING");
                }
            }
            
            // ⭐ Проверка: убеждаемся, что пары действительно находятся сразу после Video
            var finalVideoIndex = -1;
            for (var vi = 1; vi <= comp.numLayers; vi++) {
                try {
                    var layer = comp.layer(vi);
                    if (layer.name === LAYER_NAMES.VIDEO && layer.source instanceof CompItem) {
                        if (videoSrcFolder && layer.source.parentFolder === videoSrcFolder) {
                            finalVideoIndex = vi;
                            break;
                        }
                    }
                } catch (e) {
                    continue;
                }
            }
            
            if (finalVideoIndex > 0) {
                var firstMaskAfterVideo = null;
                if (finalVideoIndex < comp.numLayers) {
                    try {
                        firstMaskAfterVideo = comp.layer(finalVideoIndex + 1);
                        log("Проверка: после Video (index: " + finalVideoIndex + ") находится слой: '" + firstMaskAfterVideo.name + "' (index: " + firstMaskAfterVideo.index + ")", "INFO");
                    } catch (e) {
                        log("Проверка: после Video нет слоев", "WARNING");
                    }
                }
            }
        } else {
            // Если слоя Video нет, просто располагаем маски строго друг за другом
            // Последняя маска (masks[masks.length-1]) вверху, первая маска (masks[0]) внизу
            log("Слой Video не найден, располагаем маски без привязки к Video", "INFO");
            
            // ⭐ ИЗМЕНЕНО: Перемещаем пары (маска + картинка) вместе, начиная с последней (вверху)
            // Последняя маска (masks[masks.length-1]) должна быть вверху, первая (masks[0]) - внизу
            // Перемещаем от последней к первой, чтобы каждая следующая пара размещалась ниже предыдущей
            
            // Собираем все пары
            var maskImagePairs = [];
            for (var mi = 0; mi < masks.length; mi++) {
                var mask = masks[mi];
                var maskNum = getMaskNumber(mask.name);
                var imageLayer = maskNum !== null ? imagesByMaskNumber[maskNum] : null;
                maskImagePairs.push({
                    mask: mask,
                    image: imageLayer,
                    index: mi
                });
            }
            
            // Перемещаем пары от последней к первой (сверху вниз)
            for (var pi = maskImagePairs.length - 1; pi >= 0; pi--) {
                var pair = maskImagePairs[pi];
                var mask = pair.mask;
                var imageLayer = pair.image;
                
                try {
                    if (pi === maskImagePairs.length - 1) {
                        // Последняя пара - размещаем вверху (на позицию 1)
                        if (comp.numLayers >= 1) {
                            var topLayer = comp.layer(1);
                            mask.moveBefore(topLayer);
                            log("Маска '" + mask.name + "' (последняя по inPoint, индекс в массиве: " + pair.index + ") перемещена вверху", "INFO");
                            
                            if (imageLayer) {
                                imageLayer.moveAfter(mask);
                                log("Картинка '" + imageLayer.name + "' перемещена вместе с маской", "INFO");
                            }
                        }
                    } else {
                        // Остальные пары - размещаем ниже предыдущей
                        // Следующая пара (maskImagePairs[pi + 1]) уже размещена выше
                        var nextPair = maskImagePairs[pi + 1];
                        var nextImage = nextPair.image;
                        
                        // Перемещаем маску после картинки следующей пары (если есть), иначе после маски
                        if (nextImage) {
                            mask.moveAfter(nextImage);
                            log("Маска '" + mask.name + "' (индекс в массиве: " + pair.index + ") перемещена после картинки следующей пары (ниже)", "INFO");
                        } else {
                            mask.moveAfter(nextPair.mask);
                            log("Маска '" + mask.name + "' (индекс в массиве: " + pair.index + ") перемещена после маски следующей пары (ниже)", "INFO");
                        }
                        
                        if (imageLayer) {
                            imageLayer.moveAfter(mask);
                            log("Картинка '" + imageLayer.name + "' перемещена вместе с маской", "INFO");
                        }
                    }
                } catch (e) {
                    log("Ошибка при перемещении пары (маска '" + mask.name + "'): " + e.message, "WARNING");
                }
            }
        }
        
        log("=== КОНЕЦ renameAndSortMasks ===", "INFO");
        return true;
    }, []);
}

function clearProjectFolder() {
    return safeExecute("clearProjectFolder", function() {
        var project = app.project;
        var folderName = ProjectFolderName;
        var videoFolderName = ProjectVideoFolderName;
        var removedCount = 0;

        if (!validateFolderPath(folderPath, false)) {
            throw new Error("Неверный путь к рабочей папке: " + folderPath);
        }

        var projfolder = null;
        for (var i = 1; i <= project.numItems; i++) {
            if ((project.item(i) instanceof FolderItem) && (project.item(i).name == folderName)) {
                projfolder = project.item(i);
                break;
            }
        }

        // ⭐ СОХРАНЯЕМ ДАННЫЕ О ВСЕХ ИМПОРТИРОВАННЫХ ФАЙЛАХ ИЗ MAPS.WORK ПЕРЕД УДАЛЕНИЕМ
        var mapsWorkFilesData = [];
        if (projfolder != undefined) {
            for (var mw = 1; mw <= projfolder.numItems; mw++) {
                var item = projfolder.item(mw);
                if (item.file) {
                    // Сохраняем путь к файлу и имя в проекте
                    mapsWorkFilesData.push({
                        filePath: item.file.fsName,
                        name: item.name,
                        originalName: item.file.name // Оригинальное имя файла на диске
                    });
                }
            }
            
            // Сохраняем данные в g_clearUndoData
            if (!g_clearUndoData) {
                g_clearUndoData = {};
            }
            g_clearUndoData.mapsWorkFilesData = mapsWorkFilesData;
            log("Сохранено данных о файлах из Maps.Work: " + mapsWorkFilesData.length, "INFO");
            
            while (projfolder.numItems > 0) {
                projfolder.item(1).remove();
                removedCount++;
            }
            log("Удалено элементов из папки проекта: " + removedCount, "INFO");
        } else {
            log("Папка с именем " + folderName + " не найдена", "WARNING");
        }

        var videofolder = null;
        for (var i = 1; i <= project.numItems; i++) {
            if ((project.item(i) instanceof FolderItem) && (project.item(i).name == videoFolderName)) {
                videofolder = project.item(i);
                break;
            }
        }
        
        // ⭐ СОХРАНЯЕМ ДАННЫЕ О ВИДЕО ПЕРЕД УДАЛЕНИЕМ
        var videoData = [];
        if (videofolder != undefined) {
            for (var i = 1; i <= videofolder.numItems; i++) {
                var item = videofolder.item(i);
                if (!(item instanceof CompItem) && item.file) {
                    // Сохраняем путь к файлу видео
                    videoData.push({
                        filePath: item.file.fsName,
                        name: item.name
                    });
                }
            }
            
            // Сохраняем данные о слоях видео в композиции Video
            var videoComp = findCompByName(COMP_NAMES.VIDEO);
            var videoLayersData = [];
            if (videoComp) {
                for (var j = 1; j <= videoComp.numLayers; j++) {
                    var layer = videoComp.layer(j);
                    if (layer.name === LAYER_NAMES.VIDEO && layer.source && layer.source.file) {
                        videoLayersData.push({
                            filePath: layer.source.file.fsName,
                            inPoint: layer.inPoint,
                            outPoint: layer.outPoint,
                            enabled: layer.enabled,
                            audioEnabled: layer.audioEnabled,
                            index: j
                        });
                    }
                }
            }
            
            // Сохраняем данные в g_clearUndoData
            if (!g_clearUndoData) {
                g_clearUndoData = {};
            }
            g_clearUndoData.videoData = videoData;
            g_clearUndoData.videoLayersData = videoLayersData;
            log("Сохранено данных о видео: " + videoData.length + " файлов, " + videoLayersData.length + " слоев", "INFO");
            
            var videoRemovedCount = 0;
            for (var i = videofolder.numItems; i >= 1; i--) {
                if (!(videofolder.item(i) instanceof CompItem)) {
                    videofolder.item(i).remove();
                    videoRemovedCount++;
                }
            }
            log("Удалено элементов из видео папки: " + videoRemovedCount, "INFO");
        } else {
            log("Папка с именем " + videoFolderName + " не найдена", "WARNING");
        }    
        
        return true;
    }, []);
}

function clearWorkFolder(deleteFolder, deleteFolderPath) {
    return safeExecute("clearWorkFolder", function() {
        var files = deleteFolder.getFiles();
        var removedCount = 0;
        
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            
            if (file instanceof Folder) {
                clearWorkFolder(file, file.fsName);
            }
            
            try {
                // Принудительное удаление файла
                if (file.exists) {
            file.remove();
                    // Проверяем, что файл действительно удален
                    if (file.exists) {
                        log("Не удалось удалить файл: " + file.fsName, "WARNING");
                    } else {
            removedCount++;
                    }
                }
            } catch (e) {
                log("Ошибка при удалении файла " + file.fsName + ": " + e.message, "ERROR");
            }
        }
        
        log("Удалено файлов из " + deleteFolderPath + ": " + removedCount, "INFO");
        checkWorkFolder(deleteFolder, deleteFolderPath);
        return removedCount;
    }, []);
}

function checkWorkFolder(checkFolder, checkedFolderPath) {
    return safeExecute("checkWorkFolder", function() {
        if (checkFolder.exists) {
            var files = checkFolder.getFiles();
            if (files.length > 0) {
                var confirmDelete = confirm("В папке " + checkFolder + " есть файлы. Удалить их?");
                if (confirmDelete) {
                    clearWorkFolder(checkFolder, checkedFolderPath);
                }
            } else {
                alert("Папка " + checkedFolderPath + " пуста.");
            }
        } else {
            alert("Каталог " + checkedFolderPath + " не существует.");
        }
        return true;
    }, []);
}

function copyFilesToBackup(sourceFolderPath, backupFolderPath) {
    return safeExecute("copyFilesToBackup", function() {
        var sourceFolder = new Folder(sourceFolderPath);
        var backupFolder = new Folder(backupFolderPath); 

        if (!backupFolder.exists) {
            backupFolder.create();
        }

        var files = sourceFolder.getFiles();
        var copiedCount = 0;
        
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (file instanceof Folder) {
                copyFilesToBackup(file.fsName, backupFolder.fsName + "/" + file.name);
            } else {
                file.copy(backupFolder.fsName + "/" + file.name);
                copiedCount++;
            }
        }
        
        log("Скопировано файлов в бэкап: " + copiedCount, "INFO");
        return copiedCount;
    }, []);
}

function createBackupAEProject() {
    return safeExecute("createBackupAEProject", function() {
        var projectFile = app.project.file;
        if (projectFile) {
            var projectPath = projectFile.path;
            var backupProjectName = "MeteoCalendarOut.BAK.aep";
        
            if (!validateFolderPath(projectPath, true)) {
                throw new Error("Не удалось создать папку для бэкапа проекта: " + projectPath);
            }
            
            var currentProjectFile = app.project.file;
            var backupProjectFile = new File(projectPath + "/" + backupProjectName);
            
            currentProjectFile.copy(backupProjectFile);
            log("Создан бэкап проекта: " + backupProjectFile.fsName, "SUCCESS");
            return true;
        } else {
            log("Проект не сохранен, бэкап не создан", "WARNING");
            return false;
        }
    }, []);
}

// === PATCH 5: ФУНКЦИИ ИМПОРТА С ЛОГИРОВАНИЕМ ===
btnImportImage.onClick = function() {
    app.beginUndoGroup("Import Images");
    try {
        return safeExecute("importImages", function() {
            var result = ImportImages();
            return result;
        }, []);
    } finally {
        app.endUndoGroup();
    }
}

/**
 * Проверяет, имеет ли файл разрешенное расширение
 * @param {String} fileName - имя файла
 * @param {Array<String>} extensions - массив разрешенных расширений
 * @returns {Boolean} true если расширение разрешено
 */
function hasAllowedExtension(fileName, extensions) {
    var lastDotIndex = fileName.lastIndexOf(".");
    var fileExt = fileName.substr(lastDotIndex).toLowerCase();
    for (var i = 0; i < extensions.length; i++) {
        var ext = extensions[i];
        if (ext.substr(0, 1) !== ".") ext = "." + ext;
        if (fileExt === ext.toLowerCase()) return true;
    }
    return false;
}

/**
 * Импортирует изображения из папки Maps.Work в проект
 * @returns {Number} количество импортированных файлов
 */
function ImportImages() {
    if (!validateFolderPath(folderPath, false)) {
        alert("Проверьте путь к папке с изображениями!");
        return false;
    }
    
    try {
        if (folder.exists) {
            var files = folder.getFiles();
            var allowedExtensions = [".jpg", ".jpeg", ".png", ".psd", ".exr", ".mp4", ".mov", ".avi", ".mkv"];

            var folderName = ProjectFolderName;
            var projectFolder = null;
            
            for (var i = 1; i <= app.project.rootFolder.numItems; i++) {
                if (app.project.rootFolder.item(i).name === folderName && app.project.rootFolder.item(i) instanceof FolderItem) {
                    projectFolder = app.project.rootFolder.item(i);
                    break;
                }
            }

            if (!projectFolder) {
                projectFolder = app.project.items.addFolder(folderName);
                log("Создана папка проекта: " + folderName, "INFO");
            }
            
            var importedCount = 0;
            
            if (importCheck.value == true) {
                for (var i = 0; i < files.length; i++) {
                    var file = files[i];
                    if (file instanceof File && hasAllowedExtension(file.name, allowedExtensions)) {
                        var alreadyImported = false;
                        for (var j = 1; j <= app.project.numItems; j++) {
                            if (app.project.item(j).name === file.name) {
                                alreadyImported = true;
                                break;
                            }
                        }

                        if (!alreadyImported) {
                            try {
                                var importOptions = new ImportOptions(file);
                                var importedFile = app.project.importFile(importOptions);
                                
                                if (!importedFile) {
                                    log("Не удалось импортировать файл: " + file.name, "ERROR");
                                    continue;
                                }
                                
                                importedFile.parentFolder = projectFolder;
                                
                                // Переименовываем в формат MeteoImg_Src_XX
                                var nextNumber = getNextMeteoImageNumber(projectFolder);
                                var newName = LAYER_NAMES.METEO_IMAGE_SRC + "_" + (nextNumber < 10 ? "0" + nextNumber : nextNumber.toString());
                                importedFile.name = newName;
                                log("Импортирован и переименован: " + file.name + " -> " + newName, "INFO");
                                
                                importedFile.selected = true;
                                importedCount++;
                            } catch (e) {
                                log("Ошибка при импорте файла " + file.name + ": " + e.message, "ERROR");
                                continue;
                            }
                        }
                    }
                }
                deselectFolderElements();
                log("Импортировано файлов: " + importedCount, "SUCCESS");
                alert("Импортировано файлов: " + importedCount);
            } else {
                var latestFile = null;
                var latestDate = new Date(0);

                for (var i = 0; i < files.length; i++) {
                    var file = files[i];
                    if (file instanceof File && file.modified > latestDate && hasAllowedExtension(file.name, allowedExtensions)) {
                        latestFile = file;
                        latestDate = file.modified;
                    }
                }            

                if (latestFile) {
                    var alreadyImported = false;
                    for (var i = 1; i <= app.project.numItems; i++) {
                        if (app.project.item(i).name === latestFile.name) {
                            alreadyImported = true;
                            break;
                        }
                    }

                    if (!alreadyImported) {
                        try {
                            deselectFolderElements();
                            var importOptions = new ImportOptions(latestFile);
                            var importedFile = app.project.importFile(importOptions);
                            
                            if (!importedFile) {
                                throw new Error("Не удалось импортировать файл: " + latestFile.name);
                            }
                            
                            importedFile.parentFolder = projectFolder;
                            
                            // Переименовываем в формат MeteoImg_Src_XX
                            var nextNumber = getNextMeteoImageNumber(projectFolder);
                            var newName = LAYER_NAMES.METEO_IMAGE_SRC + "_" + (nextNumber < 10 ? "0" + nextNumber : nextNumber.toString());
                            importedFile.name = newName;
                            log("Импортирован и переименован: " + latestFile.name + " -> " + newName, "SUCCESS");
                            
                            importedFile.selected = true;
                            importedCount = 1;
                            
                            alert("Файл " + latestFile.name + " импортирован как " + newName + ".");
                        } catch (e) {
                            log("Ошибка при импорте файла " + latestFile.name + ": " + e.message, "ERROR");
                            alert("Ошибка при импорте файла: " + e.message);
                        }
                    } else {
                        log("Файл уже импортирован: " + latestFile.name, "INFO");
                        alert("Файл уже импортирован.");
                    }
                } else {
                    log("Не найдено файлов для импорта в: " + folderPath, "WARNING");
                    alert("Файлы не найдены.");
                }
            }
            return importedCount;
        } else {
            throw new Error("Директория не существует: " + folderPath);
        }
    } catch (e) {
        throw new Error("ImportImages: " + e.message);
    }
}

/**
 * Снимает выделение со всех элементов папки проекта
 * @returns {Boolean} true если операция выполнена успешно
 */
function deselectFolderElements() {
    return safeExecute("deselectFolderElements", function() {
        var folderName = ProjectFolderName;
        var projectFolder = null;

        for (var i = 1; i <= app.project.rootFolder.numItems; i++) {
            if (app.project.rootFolder.item(i).name === folderName && app.project.rootFolder.item(i) instanceof FolderItem) {
                projectFolder = app.project.rootFolder.item(i);
                break;
            }
        }

        if (projectFolder) {
            for (var i = 1; i <= projectFolder.numItems; i++) {
                var item = projectFolder.item(i);
                item.selected = false;
            }
            log("Снято выделение с элементов папки: " + folderName, "INFO");
        } else {
            log("Папка " + folderName + " не найдена в проекте.", "WARNING");
        }
        return true;
    }, []);
}

// === PATCH 6: ОСТАЛЬНЫЕ ФУНКЦИИ С ОБРАБОТКОЙ ОШИБОК ===

/**
 * Применяет шаблон рендера с fallback на случай отсутствия основного шаблона
 * @param {OutputModule} outputModule - модуль вывода рендера
 * @param {String} templateName - имя основного шаблона
 * @param {String} fallbackTemplate - имя резервного шаблона
 * @returns {Boolean} true если шаблон применен успешно
 */
function applyRenderTemplateWithFallback(outputModule, templateName, fallbackTemplate) {
    return safeExecute("applyRenderTemplateWithFallback", function() {
        try {
            outputModule.applyTemplate(templateName);
            log("Применен шаблон рендера: " + templateName, "SUCCESS");
            return true;
        } catch (e) {
            log("Шаблон '" + templateName + "' не найден, используем fallback: " + fallbackTemplate, "WARNING");
            try {
                outputModule.applyTemplate(fallbackTemplate);
                log("Применен fallback шаблон: " + fallbackTemplate, "INFO");
                return true;
            } catch (e2) {
                log("Не удалось применить fallback шаблон: " + fallbackTemplate + " - " + e2.message, "ERROR");
                return false;
            }
        }
    }, []);
}

/**
 * Снимает выделение со всех слоев композиции
 * @param {CompItem} comp - композиция
 */
function clearSelection(comp) {
    if (!comp) return;
    try {
        for (var i = 1; i <= comp.numLayers; i++) {
            try {
                comp.layer(i).selected = false;
            } catch (e) {
                // Игнорируем ошибки при снятии выделения
            }
        }
    } catch (e) {
        log("Ошибка при снятии выделения: " + e.message, "WARNING");
    }
}

/**
 * Показывает предупреждения о проблемах с масками
 * @param {Array} warnings - массив предупреждений
 * @param {CompItem} [comp] - композиция для открытия в viewer
 */
function showWarnings(warnings, comp) {
    if (!warnings || warnings.length === 0) return;
    
    var message = "⚠️ ОБНАРУЖЕНЫ ПРОБЛЕМЫ С МАСКАМИ:\n\n";
    
    for (var w = 0; w < warnings.length; w++) {
        var warning = warnings[w];
        message += "Маска: " + warning.mask.name + " (#" + warning.mask.index + ")\n";
        message += "MeteoImage: " + warning.meteoImage.name + " (#" + warning.meteoImage.index + ")\n";
        message += "Проблемы: " + warning.problems.join(", ") + "\n\n";
    }
    
    // Выделяем все проблемные слои
    for (var w = 0; w < warnings.length; w++) {
        var warning = warnings[w];
        for (var s = 0; s < warning.layersToSelect.length; s++) {
            warning.layersToSelect[s].selected = true;
        }
    }
    
    // Открываем композицию в viewer, если она передана
    if (comp) {
        comp.openInViewer();
    }
    
    alert(message);
    
    // Снимаем выделение после диалога
    clearSelection(comp);
}

/**
 * Проверяет, является ли слой валидной маской
 * Маска должна быть: label MASK_LABEL, композиция, в папке Transitions
 * @param {Layer} layer - слой для проверки
 * @param {FolderItem} transitionsFolder - папка Transitions (опционально, если не передана - ищется)
 * @returns {Boolean} true если слой является валидной маской
 */
function isValidMaskLayer(layer, transitionsFolder) {
    try {
        // ⭐ ИЗМЕНЕНО: Сначала проверяем более строгие условия (композиция + папка)
        // Проверяем, что это композиция
        if (!(layer.source instanceof CompItem)) return false;
        
        // Находим папку Transitions, если не передана
        if (!transitionsFolder) {
            transitionsFolder = findProjectFolder("Transitions");
        }
        
        if (!transitionsFolder) return false;
        
        // Проверяем, что композиция в папке Transitions
        var compItem = layer.source;
        if (!compItem.parentFolder || compItem.parentFolder !== transitionsFolder) return false;
        
        // ⭐ ИЗМЕНЕНО: Label не является условием поиска, только исправляется автоматически
        // Если label неправильный, исправляем его автоматически
        if (layer.label !== LAYER_CONFIG.MASK_LABEL) {
            try {
                layer.label = LAYER_CONFIG.MASK_LABEL;
                log("Автоматически исправлен label маски '" + layer.name + "' на " + LAYER_CONFIG.MASK_LABEL, "INFO");
            } catch (e) {
                // Если не удалось исправить, все равно считаем маску валидной
                log("Не удалось исправить label маски '" + layer.name + "': " + e.message, "WARNING");
            }
        }
        
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Извлекает номер маски из имени (формат: "MeteoMask 01" -> 1)
 * @param {String} maskName - имя маски
 * @returns {Number|null} номер маски или null, если не найден
 */
function getMaskNumber(maskName) {
    try {
        var pattern = /^MeteoMask\s+(\d{2})$/;
        var match = maskName.match(pattern);
        if (match) {
            return parseInt(match[1], 10);
        }
        return null;
    } catch (e) {
        return null;
    }
}

/**
 * Формирует имя слоя-картинки по номеру маски (формат: MeteoImage 01)
 * @param {Number} maskNumber - номер маски
 * @returns {String} имя слоя-картинки
 */
function getImageLayerName(maskNumber) {
    var numStr = maskNumber < 10 ? "0" + maskNumber : maskNumber.toString();
    return LAYER_NAMES.METEO_IMAGE + " " + numStr;
}

/**
 * Получает следующий номер для MeteoImg_Src в папке Maps.Work
 * @param {FolderItem} projectFolder - папка Maps.Work
 * @returns {Number} следующий номер (от 1 до 99)
 */
function getNextMeteoImageNumber(projectFolder) {
    if (!projectFolder || !projectFolder.numItems) {
        return 1; // Если папка пуста, начинаем с 1
    }
    
    var maxNumber = 0;
    var pattern = /^MeteoImg_Src_(\d{2})$/;
    
    for (var i = 1; i <= projectFolder.numItems; i++) {
        try {
            var item = projectFolder.item(i);
            if (!item || !item.name) {
                continue;
            }
            var match = item.name.match(pattern);
            if (match) {
                var num = parseInt(match[1], 10);
                if (!isNaN(num) && num > maxNumber) {
                    maxNumber = num;
                }
            }
        } catch (e) {
            log("Ошибка при обработке элемента " + i + " в папке: " + e.message, "WARNING");
            continue;
        }
    }
    
    var nextNumber = maxNumber + 1;
    // ⭐ ИЗМЕНЕНО: Защита от переполнения номеров
    // Если достигнут максимальный номер, проверяем существование source с номером 1 в папке проекта AE
    if (nextNumber > LAYER_CONFIG.MAX_IMAGE_NUMBER) {
        // Проверяем, существует ли source с именем MeteoImg_Src_01 в папке проекта AE
        var checkName = LAYER_NAMES.METEO_IMAGE_SRC + "_01";
        var sourceExists = false;
        for (var j = 1; j <= projectFolder.numItems; j++) {
            try {
                var checkItem = projectFolder.item(j);
                if (checkItem && checkItem.name === checkName) {
                    sourceExists = true;
                    break;
                }
            } catch (e) {
                continue;
            }
        }
        
        if (sourceExists) {
            // Если source с номером 01 существует в папке проекта, выбрасываем ошибку
            var errorMsg = "Достигнут максимальный номер (" + LAYER_CONFIG.MAX_IMAGE_NUMBER + "). Удалите старые источники из папки проекта перед продолжением.";
            log(errorMsg, "ERROR");
            throw new Error(errorMsg);
        } else {
            // Если source с номером 01 нет в папке проекта, можно начать с 1
            log("Достигнут максимальный номер (" + LAYER_CONFIG.MAX_IMAGE_NUMBER + "), начинаем с 1 (source с номером 01 не найден в папке проекта)", "WARNING");
            nextNumber = 1;
        }
    }
    
    return nextNumber;
}

/**
 * Переименовывает source картинки в формат MeteoImg_Src_XX
 * @param {FootageItem} imageItem - исходный файл картинки
 * @returns {Boolean} true если переименование успешно, false в противном случае
 */
function renameImageSource(imageItem) {
    return safeExecute("renameImageSource", function() {
        if (!imageItem) {
            log("Ошибка: imageItem не передан в renameImageSource", "ERROR");
            return false;
        }
        
        // ⭐ ПРОВЕРКА: Если имя уже в правильном формате MeteoImg_Src_XX, не переименовываем
        var currentName = imageItem.name;
        var pattern = /^MeteoImg_Src_(\d{2})$/;
        var match = currentName.match(pattern);
        if (match) {
            log("Картинка '" + currentName + "' уже имеет правильное имя, переименование не требуется", "INFO");
            return true; // Уже в правильном формате, переименование не нужно
        }
        
        // Получаем папку Maps.Work
        var folderName = ProjectFolderName;
        var projectFolder = findProjectFolder(folderName);
        
        if (!projectFolder) {
            log("Папка '" + folderName + "' не найдена в проекте", "WARNING");
            return false;
        }
        
        // Проверяем, что imageItem находится в нужной папке
        if (imageItem.parentFolder !== projectFolder) {
            log("Картинка '" + imageItem.name + "' не находится в папке '" + folderName + "'", "WARNING");
            return false;
        }
        
        // Получаем следующий номер
        var nextNumber = getNextMeteoImageNumber(projectFolder);
        var newName = LAYER_NAMES.METEO_IMAGE_SRC + "_" + (nextNumber < 10 ? "0" + nextNumber : nextNumber.toString());
        
        // Проверяем, не существует ли уже файл с таким именем
        var nameExists = false;
        for (var j = 1; j <= projectFolder.numItems; j++) {
            try {
                var item = projectFolder.item(j);
                if (item !== imageItem && item.name === newName) {
                    nameExists = true;
                                break;
                            }
            } catch (e) {
                continue;
            }
        }
        
        if (nameExists) {
            log("Файл с именем '" + newName + "' уже существует в папке", "WARNING");
            return false;
        }
        
        // Переименовываем
        try {
            var oldName = imageItem.name;
            imageItem.name = newName;
            log("Source картинки переименован: '" + oldName + "' -> '" + newName + "'", "INFO");
            return true;
        } catch (e) {
            log("Ошибка при переименовании source картинки: " + e.message, "ERROR");
            return false;
        }
    }, []);
}

/**
 * Удаляет все картинки-слои, у которых имя НЕ соответствует MeteoImage + номер маски
 * @param {CompItem} comp - композиция
 */
function removeIncorrectImageLayers(comp) {
    return safeExecute("removeIncorrectImageLayers", function() {
        log("=== НАЧАЛО removeIncorrectImageLayers ===", "INFO");
        
        // Находим папку Transitions один раз
        var transitionsFolder = findProjectFolder("Transitions");
        
        // Собираем все маски с их номерами
        var masksByNumber = {};
        for (var i = 1; i <= comp.numLayers; i++) {
            try {
                var layer = comp.layer(i);
                // ⭐ УЛУЧШЕННАЯ ПРОВЕРКА: используем функцию проверки валидности маски
                if (isValidMaskLayer(layer, transitionsFolder) && layer.name.indexOf(LAYER_NAMES.METEO_MASK) === 0) {
                    var maskNum = getMaskNumber(layer.name);
                    if (maskNum !== null) {
                        masksByNumber[maskNum] = layer;
                    }
                }
            } catch (e) {
                continue;
            }
        }
        
        log("Найдено масок: " + Object.keys(masksByNumber).length, "INFO");
        
        // Собираем все картинки в Maps.Work
        var imagesToCheck = [];
        for (var i = 1; i <= comp.numLayers; i++) {
            try {
                var layer = comp.layer(i);
                if (isImageInMapsTemp(layer)) {
                    imagesToCheck.push(layer);
                }
            } catch (e) {
                continue;
            }
        }
        
        log("Найдено картинок в Maps.Work: " + imagesToCheck.length, "INFO");
        
        // Проверяем каждую картинку
        var removedCount = 0;
        for (var j = 0; j < imagesToCheck.length; j++) {
            var imageLayer = imagesToCheck[j];
            var imageName = imageLayer.name;
            
            // Проверяем, соответствует ли имя формату MeteoImage + пробел + номер
            var imagePattern = /^MeteoImage (\d{2})$/;
            var imageMatch = imageName.match(imagePattern);
            
            if (imageMatch) {
                var imageNum = parseInt(imageMatch[1], 10);
                // Проверяем, есть ли маска с таким номером
                if (masksByNumber[imageNum]) {
                    // Имя правильное, оставляем
                    log("Картинка '" + imageName + "' имеет правильное имя для маски #" + imageNum, "INFO");
                    continue;
                } else {
                    // Имя правильное по формату, но маски с таким номером нет - удаляем
                    log("Картинка '" + imageName + "' имеет правильное имя, но маски #" + imageNum + " нет - удаляем", "WARNING");
                }
            } else {
                // Имя не соответствует формату - удаляем
                log("Картинка '" + imageName + "' имеет неправильное имя - удаляем", "WARNING");
            }
            
            // Удаляем картинку
            try {
                imageLayer.remove();
                removedCount++;
                log("Удалена картинка: " + imageName, "INFO");
            } catch (e) {
                log("Ошибка при удалении картинки '" + imageName + "': " + e.message, "WARNING");
            }
        }
        
        log("Удалено неправильных картинок: " + removedCount, "INFO");
        log("=== КОНЕЦ removeIncorrectImageLayers ===", "INFO");
        return removedCount;
    }, []);
}

/**
 * Новая функция поиска свободной маски по новому алгоритму
 * Перебирает все картинки MeteoImage + номерМаски в Maps.Work
 * Если имена совпадают, все FALSE атрибуты приводим в TRUE
 * Только если находится действительно свободная маска, у которой нет именной пары, ее и считаем свободной
 * @param {CompItem} comp - композиция
 * @returns {Layer|null} свободная маска или null
 */
function findFreeMaskNew(comp) {
    return safeExecute("findFreeMaskNew", function() {
        log("=== НАЧАЛО findFreeMaskNew ===", "INFO");
        
        // ⭐ ИЗМЕНЕНО: Убрана проверка и переименование масок - это теперь делается только через Sort Masks
        // Если маски имеют неправильные имена, пользователь должен сначала нажать Sort Masks
        
        // Находим папку Transitions один раз
        var transitionsFolder = findProjectFolder("Transitions");
        
        if (!transitionsFolder) {
            log("Папка 'Transitions' не найдена в проекте", "WARNING");
            return null;
        }
        
        // ⭐ ИЗМЕНЕНО: Собираем все маски с их номерами, но НЕ исправляем label
        // Все исправления масок должны выполняться через кнопку Sort Masks
        // Проверяем только базовые признаки: композиция, в папке Transitions, правильное имя
        var masksByNumber = {};
        var maskCandidates = [];
        for (var i = 1; i <= comp.numLayers; i++) {
            try {
                var layer = comp.layer(i);
                
                // Проверяем базовые признаки без автоматического исправления label
                if (layer && layer.source instanceof CompItem) {
                    var compItem = layer.source;
                    if (compItem.parentFolder && compItem.parentFolder === transitionsFolder) {
                        // Это валидная маска по базовым признакам
                        // Проверяем имя (должно быть MeteoMask XX)
                        if (layer.name.indexOf(LAYER_NAMES.METEO_MASK) === 0) {
                            var maskNum = getMaskNumber(layer.name);
                            if (maskNum !== null) {
                                masksByNumber[maskNum] = layer;
                                maskCandidates.push(layer);
                            }
                        }
                    }
                }
            } catch (e) {
                continue;
            }
        }
        
        log("Найдено масок-кандидатов: " + maskCandidates.length, "INFO");
        
        if (maskCandidates.length === 0) {
            log("Не найдено масок-кандидатов", "WARNING");
            return null;
        }
        
        // Сортируем по inPoint (первый по таймлайну), затем по индексу
        maskCandidates.sort(function(a, b) {
            var aPoint = a.inPoint !== undefined && a.inPoint !== null ? a.inPoint : 0;
            var bPoint = b.inPoint !== undefined && b.inPoint !== null ? b.inPoint : 0;
            if (aPoint === bPoint) {
                return a.index - b.index;
            }
            return aPoint - bPoint;
        });
        
        // Собираем все картинки MeteoImage + номерМаски в Maps.Work
        var imagesByMaskNumber = {};
            for (var i = 1; i <= comp.numLayers; i++) {
                try {
                    var layer = comp.layer(i);
                    if (isImageInMapsTemp(layer)) {
                    var imagePattern = /^MeteoImage (\d{2})$/;
                    var imageMatch = layer.name.match(imagePattern);
                    if (imageMatch) {
                        var imageNum = parseInt(imageMatch[1], 10);
                        imagesByMaskNumber[imageNum] = layer;
                    }
                    }
                } catch (e) {
                    continue;
                }
            }
            
        log("Найдено картинок с правильными именами: " + Object.keys(imagesByMaskNumber).length, "INFO");
        
        // Проверяем каждую маску
        for (var m = 0; m < maskCandidates.length; m++) {
            var maskLayer = maskCandidates[m];
            
            // ⭐ ЗАЩИТА: Проверяем, что маска всё ещё доступна (не удалена между проходами)
            try {
                var testInPoint = maskLayer.inPoint; // Провоцируем ошибку, если слой удалён
                var testName = maskLayer.name; // Проверяем доступность имени
            } catch (e) {
                log("Маска стала недоступна между проходами: " + e.message + ", пропускаем", "WARNING");
                continue;
            }
            
            var maskNum = getMaskNumber(maskLayer.name);
            
            if (maskNum === null) {
                log("Не удалось извлечь номер маски: " + maskLayer.name, "WARNING");
                continue;
            }
            
            log("Проверка маски: " + maskLayer.name + " (#" + maskNum + ")", "INFO");
            
            // Проверяем, есть ли картинка с таким же номером
            var imageLayer = imagesByMaskNumber[maskNum];
            
            if (!imageLayer) {
                // Нет картинки с таким номером - маска свободна
                // ⭐ ЗАЩИТА: Финальная проверка доступности перед возвратом
                try {
                    var finalTest = maskLayer.name; // Проверяем, что маска всё ещё доступна
                    log("Маска '" + maskLayer.name + "' свободна (нет картинки MeteoImage " + (maskNum < 10 ? "0" + maskNum : maskNum.toString()) + ")", "INFO");
                    return maskLayer;
                } catch (e) {
                    log("Маска стала недоступна перед возвратом: " + e.message + ", пропускаем", "WARNING");
                    continue;
                }
            }
            
            // Есть картинка с таким же номером - проверяем атрибуты
            log("Найдена картинка с таким же номером: " + imageLayer.name, "INFO");
            
            // ⭐ ЗАЩИТА: Проверяем доступность картинки перед проверкой атрибутов
            var layerParent, hasTrackMatte, isDirectlyBelow, inPointMatch, outPointMatch, pointsMatch;
            try {
                layerParent = imageLayer.parent;
                hasTrackMatte = imageLayer.hasTrackMatte;
                isDirectlyBelow = imageLayer.index === maskLayer.index + 1;
                inPointMatch = Math.abs(imageLayer.inPoint - maskLayer.inPoint) < LAYER_CONFIG.TIME_PRECISION;
                outPointMatch = Math.abs(imageLayer.outPoint - maskLayer.outPoint) < LAYER_CONFIG.TIME_PRECISION;
                pointsMatch = inPointMatch && outPointMatch;
            } catch (e) {
                log("Картинка или маска стали недоступны при проверке атрибутов: " + e.message + ", пропускаем маску", "WARNING");
                continue;
            }
                
            log("  parent: " + (layerParent ? layerParent.name + " (#" + layerParent.index + ")" : "null"), "INFO");
            log("  hasTrackMatte: " + hasTrackMatte, "INFO");
            log("  isDirectlyBelow: " + isDirectlyBelow, "INFO");
            log("  pointsMatch: " + pointsMatch, "INFO");
            
            // Т.К. У НАС ИМЕНА СОВПАДАЮТ, ТО МЫ ТЕПЕРЬ ЗНАЕМ КТО К КОМУ ОТНОСИТСЯ
            // И ВСЕ FALSE ПРИВОДИМ В TRUE И ПОЛУЧАЕМ -> [parent], [trackMatte], [imageUnderMask], [in/out-point]
            // Это означает, что маска занята
            log("  Имена совпадают - маска занята (приводим все FALSE в TRUE)", "INFO");
            
            // Исправляем атрибуты картинки
            try {
                // ⭐ ЗАЩИТА: Проверяем доступность слоёв перед исправлением
                var testMask = maskLayer.name;
                var testImage = imageLayer.name;
                
                // Устанавливаем parent = maskLayer
                if (layerParent !== maskLayer) {
                    imageLayer.parent = maskLayer;
                    log("  Установлен parent = маска", "INFO");
                }
                
                // Устанавливаем track matte
                if (!hasTrackMatte) {
                    imageLayer.trackMatteType = TrackMatteType.ALPHA;
                    imageLayer.setTrackMatte(maskLayer, TrackMatteType.ALPHA);
                    log("  Установлен track matte", "INFO");
                }
                
                // Перемещаем под маску, если не под ней
                if (!isDirectlyBelow) {
                    imageLayer.moveAfter(maskLayer);
                    log("  Перемещен под маску", "INFO");
                }
                
                // Устанавливаем тайминги, если не совпадают
                if (!pointsMatch) {
                    var duration = TIME_CONFIG.METEO_IMAGE_DURATION + comp.frameDuration;
                    imageLayer.inPoint = maskLayer.inPoint;
                    imageLayer.outPoint = maskLayer.inPoint + duration;
                    maskLayer.outPoint = maskLayer.inPoint + duration;
                    log("  Установлены тайминги", "INFO");
                }
            } catch (e) {
                log("  Ошибка при исправлении атрибутов: " + e.message + " (маска: " + (maskLayer ? maskLayer.name : "null") + ", картинка: " + (imageLayer ? imageLayer.name : "null") + ")", "WARNING");
                // Не падаем — продолжаем проверку следующей маски
            }
        }
        
        log("=== КОНЕЦ findFreeMaskNew: НЕ НАЙДЕНО СВОБОДНЫХ МАСОК ===", "WARNING");
        return null;
    }, []);
}

/**
 * Проверяет, находится ли source слоя в папке Maps.Work.
 * 
 * @param {Layer} layer - слой для проверки
 * @returns {Boolean} true, если source слоя находится в Maps.Work
 */
function isImageInMapsTemp(layer) {
    try {
        if (!layer || !layer.source) return false;
        
        // Получаем source слоя
        var source = layer.source;
        
        // Если source - это FootageItem, проверяем его parentFolder
        if (source instanceof FootageItem) {
            var parentFolder = source.parentFolder;
            if (parentFolder && parentFolder.name === ProjectFolderName) {
                return true;
            }
        }
        
        return false;
    } catch (e) {
        log("Ошибка при проверке source в Maps.Work: " + e.message, "WARNING");
        return false;
    }
}

/**
 * Функция размещения изображения под маску
 * 
 * @param {CompItem} comp - композиция
 * @param {FootageItem} imageItem - элемент изображения для размещения
 * @param {Layer} maskLayer - слой-маска
 * @param {Boolean} isUserSelected - true если маска была выделена пользователем (в этом случае не спрашиваем, сразу заменяем)
 * @param {Array} warnings - массив для сбора предупреждений (опционально)
 */
function placeImageUnderMask(comp, imageItem, maskLayer, isUserSelected, warnings) {
    return safeExecute("placeImageUnderMask", function() {
        log("=== НАЧАЛО placeImageUnderMask ===", "INFO");
        log("  maskLayer: " + (maskLayer ? maskLayer.name + " (#" + maskLayer.index + ")" : "null"), "INFO");
        log("  imageItem: " + (imageItem ? imageItem.name : "null"), "INFO");
        log("  isUserSelected: " + (isUserSelected ? "true" : "false"), "INFO");
        
        // Если параметр не передан, считаем что маска не была выделена пользователем
        if (isUserSelected === undefined) {
            isUserSelected = false;
        }
        // Инициализируем массив предупреждений, если не передан
        if (warnings === undefined) {
            warnings = [];
        }
        if (!maskLayer || maskLayer.inPoint === undefined || maskLayer.inPoint === null) {
            log("ОШИБКА: Некорректный слой маски: отсутствует inPoint", "ERROR");
            throw new Error("Некорректный слой маски: отсутствует inPoint");
        }
        
        log("Проверка inPoint маски пройдена: " + maskLayer.inPoint, "INFO");
        
        // === НОВАЯ ЛОГИКА: Проверяем по имени картинки ===
        // После removeIncorrectImageLayers все картинки имеют правильные имена
        // Проверяем, есть ли картинка с именем MeteoImage + номер маски
        var maskNumber = getMaskNumber(maskLayer.name);
        if (maskNumber === null) {
            throw new Error("Не удалось извлечь номер маски из имени: " + maskLayer.name);
        }
        
        var expectedImageName = getImageLayerName(maskNumber);
        log("Ожидаемое имя картинки для маски '" + maskLayer.name + "': " + expectedImageName, "INFO");
        
        // Ищем картинку с таким именем
        var existingImageLayer = null;
        for (var i = 1; i <= comp.numLayers; i++) {
            try {
                var layer = comp.layer(i);
                if (layer === maskLayer) continue;
                
                // Проверяем, находится ли source слоя в Maps.Work
                if (!isImageInMapsTemp(layer)) continue;
                
                // Проверяем по имени
                if (layer.name === expectedImageName) {
                    existingImageLayer = layer;
                    log("Найдена существующая картинка с правильным именем: " + layer.name + " (#" + layer.index + ")", "INFO");
                    break;
                }
            } catch (e) {
                log("Ошибка при проверке слоя " + i + ": " + e.message, "WARNING");
                    continue;
                }
            }
            
        // Если найдена существующая картинка - удаляем ее
        if (existingImageLayer) {
            try {
                log("Удаление существующей картинки: " + existingImageLayer.name + " (#" + existingImageLayer.index + ")", "INFO");
                existingImageLayer.remove();
                log("Картинка успешно удалена", "SUCCESS");
        } catch (e) {
                log("Ошибка при удалении картинки: " + e.message, "WARNING");
                throw new Error("Не удалось удалить существующую картинку: " + e.message);
            }
        } else {
            log("Нет существующей картинки с именем '" + expectedImageName + "', размещаем новую", "INFO");
        }
        
        // === РАЗМЕЩЕНИЕ НОВОЙ КАРТИНКИ ===
        var newLayer = comp.layers.add(imageItem);
        if (!newLayer) {
            throw new Error("Не удалось добавить слой в композицию");
        }
        
        // Перемещаем слой под маску
        newLayer.moveAfter(maskLayer);
        
        // Устанавливаем inPoint и outPoint как у маски
        var duration = TIME_CONFIG.METEO_IMAGE_DURATION + comp.frameDuration;
        if (isNaN(duration) || duration <= 0) {
            throw new Error("Некорректная длительность: " + duration);
        }
        
        newLayer.inPoint = maskLayer.inPoint;
        newLayer.outPoint = maskLayer.inPoint + duration;
        maskLayer.outPoint = maskLayer.inPoint + duration;
        
        // Назначаем track matte
        newLayer.trackMatteType = TrackMatteType.ALPHA;
        newLayer.setTrackMatte(maskLayer, TrackMatteType.ALPHA);
        
        // ВАЖНО: Привязываем через parent (единственный источник правды)
        newLayer.parent = maskLayer;
        
        // Извлекаем номер маски из имени
        var maskNumber = getMaskNumber(maskLayer.name);
        if (maskNumber === null) {
            throw new Error("Не удалось извлечь номер маски из имени: " + maskLayer.name);
        }
        
        // Переименовываем в MeteoImage + номер маски
        newLayer.name = getImageLayerName(maskNumber);
        
        // Переименовываем source картинки в формат MeteoImg_Src_XX
        try {
            renameImageSource(imageItem);
        } catch (e) {
            log("Ошибка при переименовании source картинки: " + e.message, "WARNING");
        }
        
        // Устанавливаем курсор на первую треть маски между in и out point
        try {
            var finalMaskInPoint = maskLayer.inPoint !== undefined && maskLayer.inPoint !== null ? maskLayer.inPoint : 0;
            var finalMaskOutPoint = maskLayer.outPoint !== undefined && maskLayer.outPoint !== null ? maskLayer.outPoint : finalMaskInPoint;
            var finalMaskDuration = finalMaskOutPoint - finalMaskInPoint;
            var finalMaskCursorTime = finalMaskInPoint + finalMaskDuration * TIME_CONFIG.MASK_CURSOR_POSITION;
            comp.time = finalMaskCursorTime;
            log("Курсор перемещен на первую треть маски: " + finalMaskCursorTime, "INFO");
        } catch (e) {
            log("Ошибка при перемещении курсора: " + e.message, "WARNING");
        }
        
        newLayer.selected = true;
        comp.openInViewer();
        
        log("Размещен слой '" + newLayer.name + "' (index: " + newLayer.index + ") под маску '" + maskLayer.name + "' (index: " + maskLayer.index + ")", "SUCCESS");
        
        return newLayer;
    }, []);
}

// ⭐ НОВЫЙ ОБРАБОТЧИК: Сортировка масок
btnSortMasks.onClick = function() {
    app.beginUndoGroup("Sort & Fix Masks");
    try {
        return safeExecute("sortMasks", function() {
            var compName = ComposeName;
            var mainComp = findCompByName(compName);

            if (!mainComp) {
                throw new Error('Композиция "' + compName + '" не найдена в проекте.');
            }
            
            // Открываем композицию в окне просмотра
            mainComp.openInViewer();
            
            // Исправляем порядок и имена масок
            log("Исправление порядка и имен масок", "INFO");
            var result = renameAndSortMasks();
            
            if (result) {
                log("Маски успешно отсортированы и переименованы", "SUCCESS");
            } else {
                log("Не удалось отсортировать маски", "WARNING");
            }
            
            return result;
        }, []);
    } finally {
        app.endUndoGroup();
    }
}

btnPlaceImage.onClick = function() {
    app.beginUndoGroup("Place Image Under Mask");
    try {
        return safeExecute("placeImage", function() {
        var compName = ComposeName;
        var mainComp = findCompByName(compName);

        if (!mainComp) {
            throw new Error('Композиция "' + compName + '" не найдена в проекте.');
        }
        
        // Открываем композицию в окне просмотра
        mainComp.openInViewer();
        
        var selectedLayers = mainComp.selectedLayers;
        
        // === ВАЖНО: Сохраняем информацию о выделенной маске ДО удаления картинок ===
        // ⭐ ИЗМЕНЕНО: Проверяем по базовым признакам (композиция, в папке Transitions), исправляем имя и label
        // ⭐ ИЗМЕНЕНО: Сохраняем имя маски вместо индекса (индекс может измениться после удаления слоев)
        var selectedMaskLayer = null;
        var selectedMaskLayerName = null;
        if (selectedLayers.length === 1) {
            try {
                var layer = selectedLayers[0];
                
                // Находим папку Transitions
                var transitionsFolder = findProjectFolder("Transitions");
                
                // ⭐ ИЗМЕНЕНО: Проверяем по базовым признакам, но НЕ исправляем имя и label
                // Все исправления масок должны выполняться через кнопку Sort Masks
                // isValidMaskLayer НЕ вызывается здесь, чтобы не исправлять label автоматически
                // Проверяем только базовые признаки: композиция, в папке Transitions
                if (layer && layer.source instanceof CompItem) {
                    // Проверяем, что композиция в папке Transitions
                    var compItem = layer.source;
                    if (compItem.parentFolder && compItem.parentFolder === transitionsFolder) {
                        // Это валидная маска по базовым признакам
                        // Проверяем, имеет ли маска правильное имя
                        var maskNumber = getMaskNumber(layer.name);
                        if (maskNumber === null || layer.name.indexOf(LAYER_NAMES.METEO_MASK) !== 0) {
                            log("⚠️ Выделенная маска имеет неправильное имя: '" + layer.name + "'. Рекомендуется сначала нажать 'Sort Masks' для исправления имен и сортировки масок.", "WARNING");
                        }
                        
                        // ⭐ ИЗМЕНЕНО: Сохраняем имя маски вместо индекса (индекс может измениться после удаления слоев)
                        // Имя маски уникально и не меняется при удалении других слоев
                        selectedMaskLayerName = layer.name;
                        log("Найдена выделенная маска ДО удаления: " + layer.name + " (#" + layer.index + ")", "INFO");
                    }
                }
            } catch (e) {
                log("Ошибка при проверке выделенного слоя ДО удаления: " + e.message, "WARNING");
            }
        }
        
        // Находим папку Maps.Work
        var folderName = ProjectFolderName;
        var folder = findProjectFolder(folderName);
        
        if (folder == null) {
            throw new Error('Папка "' + folderName + '" не найдена в проекте.');
        }
        
        // Получаем выделенные элементы в папке
        var selectedItems = [];
        for (var i = 1; i <= folder.numItems; i++) {
            if (folder.item(i).selected) {
                selectedItems.push(folder.item(i));
            }
        }
        
        // Получаем последний элемент по номеру (для случаев, когда ничего не выделено)
        var lastItem = null;
        var pattern = /^MeteoImg_Src_(\d{2})$/;
        var maxNumber = -1;
        
        if (folder.numItems > 0) {
            for (var i = 1; i <= folder.numItems; i++) {
                try {
                    var item = folder.item(i);
                    if (!item || !item.name) continue;
                    var match = item.name.match(pattern);
                    if (match) {
                        var num = parseInt(match[1], 10);
                        if (!isNaN(num) && num > maxNumber) {
                            maxNumber = num;
                            lastItem = item;
                        }
                    }
                } catch (e) {
                    log("Ошибка при обработке элемента " + i + " в папке: " + e.message, "WARNING");
                    continue;
                }
            }
        }
        
        if (!lastItem && selectedItems.length === 0) {
            throw new Error('Не найдено элементов в формате MeteoImg_Src_XX в папке проекта "' + ProjectFolderName + '".\nВыберите элемент вручную или импортируйте изображения.');
        }
        
        // === ШАГ 1: Удаляем все картинки с неправильными именами ===
        log("ШАГ 1: Удаление всех картинок с неправильными именами", "INFO");
        removeIncorrectImageLayers(mainComp);
        
        // === Восстанавливаем ссылку на выделенную маску после удаления ===
        // ⭐ ИЗМЕНЕНО: Ищем маску по имени вместо индекса (индекс может измениться после удаления слоев)
        if (selectedMaskLayerName !== null) {
            try {
                // Находим папку Transitions (если еще не найдена)
                var transitionsFolder = findProjectFolder("Transitions");
                
                // ⭐ Ищем маску по имени (имя не меняется при удалении других слоев)
                log("Ищем выделенную маску по имени: '" + selectedMaskLayerName + "'", "INFO");
                for (var i = 1; i <= mainComp.numLayers; i++) {
                    try {
                        var l = mainComp.layer(i);
                        // Проверяем по имени и базовым признакам
                        if (l && l.name === selectedMaskLayerName && isValidMaskLayer(l, transitionsFolder)) {
                            selectedMaskLayer = l;
                            log("Восстановлена ссылка на выделенную маску по имени: " + selectedMaskLayer.name + " (#" + selectedMaskLayer.index + ")", "INFO");
                            break;
                        }
                    } catch (e) {
                        continue;
                    }
                }
                
                // Если не нашли по точному имени, возможно имя было изменено в другом месте
                // Ищем по базовым признакам и близкому имени
                if (!selectedMaskLayer) {
                    log("Маска с именем '" + selectedMaskLayerName + "' не найдена, ищем по базовым признакам", "WARNING");
                    for (var i = 1; i <= mainComp.numLayers; i++) {
                        try {
                            var l = mainComp.layer(i);
                            // ⭐ Проверяем по базовым признакам
                            if (l && isValidMaskLayer(l, transitionsFolder)) {
                                // Проверяем, что имя начинается с MeteoMask (может быть другой номер после переименования)
                                if (l.name && l.name.indexOf(LAYER_NAMES.METEO_MASK) === 0) {
                                    // Берем первую найденную маску (скорее всего это выделенная, если она единственная)
                                    selectedMaskLayer = l;
                                    log("Найдена маска по базовым признакам: " + selectedMaskLayer.name + " (#" + selectedMaskLayer.index + ")", "INFO");
                                    break;
                                }
                            }
                        } catch (e) {
                            continue;
                        }
                    }
                }
            } catch (e) {
                log("Ошибка при восстановлении ссылки на маску: " + e.message, "WARNING");
            }
        }
        
        var imageItem = null;
        var maskLayer = null;
        
        // === ПЕРВОЕ УСЛОВИЕ ===
        // Если есть выделенная картинка в Maps.Work && есть выделенный слой-маска в композиции
        if (selectedItems.length > 0 && selectedMaskLayer) {
            imageItem = selectedItems[0]; // Берем первую выделенную
            maskLayer = selectedMaskLayer;
            log("ПЕРВОЕ УСЛОВИЕ: выделена картинка и выделен слой-маска", "INFO");
            // Размещаем картинку под маску, передаем true - маска выделена пользователем
            placeImageUnderMask(mainComp, imageItem, maskLayer, true);
            log("Изображение успешно размещено под маску", "SUCCESS");
            return true;
        }
        // === ВТОРОЕ УСЛОВИЕ ===
        // Если в папке Maps.Work никто не выделен && есть выделенный слой-маска в композиции
        else if (selectedItems.length === 0 && selectedMaskLayer && lastItem) {
            imageItem = lastItem; // Берем последнюю добавленную
            maskLayer = selectedMaskLayer;
            log("ВТОРОЕ УСЛОВИЕ: не выделена картинка, но выделен слой-маска", "INFO");
            // Размещаем картинку под маску, передаем true - маска выделена пользователем
            placeImageUnderMask(mainComp, imageItem, maskLayer, true);
            log("Изображение успешно размещено под маску", "SUCCESS");
            return true;
        }
        // === ТРЕТЬЕ УСЛОВИЕ ===
        // Если не выделен слой-маска в композиции (может быть выделена картинка или нет)
        else if (!selectedMaskLayer) {
            // Берем последнюю добавленную картинку
            if (selectedItems.length > 0) {
                imageItem = selectedItems[0];
            } else if (lastItem) {
                imageItem = lastItem;
            } else {
                throw new Error('Не найдено изображений для размещения.');
            }
            
            // === ШАГ 2: Ищем свободную маску новым способом ===
            log("ШАГ 2: Поиск свободной маски новым способом", "INFO");
            maskLayer = findFreeMaskNew(mainComp);
            
            if (!maskLayer) {
                throw new Error('Не найден свободный слой-маска в композиции "' + compName + '".\nВыберите слой-маску вручную или убедитесь, что есть свободные слои с именем "MeteoMask XX" и label = ' + LAYER_CONFIG.MASK_LABEL + '.');
            }
            
            // Дополнительная проверка, что maskLayer валидный
            if (!maskLayer || !maskLayer.name || maskLayer.inPoint === undefined || maskLayer.inPoint === null) {
                throw new Error('Найден некорректный слой-маска. maskLayer: ' + (maskLayer ? maskLayer.name : "null") + ", inPoint: " + (maskLayer && maskLayer.inPoint !== undefined ? maskLayer.inPoint : "undefined"));
            }
            
            log("ТРЕТЬЕ УСЛОВИЕ: не выделен слой-маска, найден автоматически: " + maskLayer.name + " (#" + maskLayer.index + ")", "INFO");
        } else {
            throw new Error('Не удалось определить условия для размещения изображения.');
        }
        
        // Размещаем изображение под маску
        if (imageItem && maskLayer) {
            placeImageUnderMask(mainComp, imageItem, maskLayer, selectedMaskLayer !== null);
            log("Изображение успешно размещено под маску", "SUCCESS");
        } else {
            throw new Error('Не удалось определить изображение или маску для размещения.');
        }
        
        return true;
    }, []);
    } finally {
        app.endUndoGroup();
    }
}

btnScaleDown.onClick = function() {
    app.beginUndoGroup("Scale Down");
    try {
        return safeExecute("scaleDown", function() {
        if (app.project.activeItem != null) {
            var comp = app.project.activeItem;
            if (comp.selectedLayers.length > 0) {
                var layer = comp.selectedLayers[0];
                ScaleLayer(comp, layer, scaleDownExpression, true);
                comp.openInViewer(); 
                log("Применено масштабирование DOWN к слою", "INFO");
            } else {
                alert("Выберите слои.");
            }
        } else {
            alert("Откройте композицию.");
        }
        return true;
    }, []);
    } finally {
        app.endUndoGroup();
    }
}

btnScaleUp.onClick = function() {
    app.beginUndoGroup("Scale Up");
    try {
        return safeExecute("scaleUp", function() {
        if (app.project.activeItem != null) {
            var comp = app.project.activeItem;
            if (comp.selectedLayers.length > 0) {
                var layer = comp.selectedLayers[0];
                ScaleLayer(comp, layer, scaleUpExpression, false);
                comp.openInViewer(); 
                log("Применено масштабирование UP к слою", "INFO");
            } else {
                alert("Выберите слои.");
            }
        } else {
            alert("Откройте композицию.");
        }
        return true;
    }, []);
    } finally {
        app.endUndoGroup();
    }
}

// === PATCH 8: ДОБАВЛЕНИЕ ОТСУТСТВУЮЩИХ ОБРАБОТЧИКОВ КНОПОК ===
btnMatte.onClick = function() {
    app.beginUndoGroup("Apply Matte");
    try {
        return safeExecute("matte", function() {
        if (app.project.activeItem != null) {
            var comp = app.project.activeItem;
            if (comp.selectedLayers.length > 0) {
                var layer = comp.selectedLayers[0];
                
                var KeyLight = layer.Effects.addProperty("Keylight (1.2)");            
                
                // Используем константы из EFFECT_CONFIG
                var hexColor = EFFECT_CONFIG.KEYLIGHT.SCREEN_COLOR;        
                var r = parseInt(hexColor.substr(0,2), 16) / 255;
                var g = parseInt(hexColor.substr(2,2), 16) / 255;
                var b = parseInt(hexColor.substr(4,2), 16) / 255;
                
                KeyLight.property("Screen Colour").setValue([r,g,b]);
                KeyLight.property("View").setValue(EFFECT_CONFIG.KEYLIGHT.VIEW);
                KeyLight.property("Screen Balance").setValue(EFFECT_CONFIG.KEYLIGHT.SCREEN_BALANCE);
                KeyLight.property("Clip Black").setValue(EFFECT_CONFIG.KEYLIGHT.CLIP_BLACK);
                KeyLight.property("Clip White").setValue(EFFECT_CONFIG.KEYLIGHT.CLIP_WHITE);
                
                var SetMatte = layer.Effects.addProperty("Set Matte");
                SetMatte.property("Use For Matte").setValue(5);
                SetMatte.enabled = false;
                
                var AdvSpillSuppressor = layer.Effects.addProperty("Advanced Spill Suppressor");        
                AdvSpillSuppressor.enabled = false;
                
                var MatteChoker = layer.Effects.addProperty("Matte Choker");
                MatteChoker.property("Choke 1").setValue(EFFECT_CONFIG.MATTE_CHOKER.CHOKE_1);
                MatteChoker.property("Gray Level Softness 1").setValue(EFFECT_CONFIG.MATTE_CHOKER.GRAY_LEVEL_SOFTNESS_1);  
                MatteChoker.enabled = false;
                
                comp.openInViewer();
                log("Применен эффект Matte к слою: " + layer.name, "SUCCESS");
            } else {
                alert("Выберите слой.");
            }
        } else {
            alert("Откройте композицию.");
        }
        return true;
    }, []);
    } finally {
        app.endUndoGroup();
    }
}

btnOutMask.onClick = function() {
    app.beginUndoGroup("Render Out Mask");
    try {
        return safeExecute("outMask", function() {
        var comp = app.project.activeItem;
        if (comp != null && (comp instanceof CompItem)) {
            var selectedLayer = comp.selectedLayers[0];
            if (selectedLayer && selectedLayer.source && selectedLayer.source.file && selectedLayer.source.hasVideo) {
                var renderQueue = app.project.renderQueue;
                var renderQueueItem = renderQueue.items.add(comp);

                var sourceFile = selectedLayer.source.file;
                var sourcePath = sourceFile.path;
                var sourceName = sourceFile.name;

                var baseName = sourceName.substr(0, sourceName.lastIndexOf("."));
                var outputName = baseName + " Mask" + ".mov";
                var outputPath = sourcePath + "/" + outputName;

                renderQueueItem.outputModule(1).file = new File(outputPath);
                applyRenderTemplateWithFallback(renderQueueItem.outputModule(1), RenderTemplate1, "H.264");
                renderQueueItem.outputModule(1).audioEnabled = false;
                
                log("Настроен рендер маски: " + outputName, "SUCCESS");
            } else {
                alert("Выберите слой, который имеет исходный видеофайл.");
            }
        } else {
            alert("Выберите композицию.");
        }
        return true;
    }, []);
    } finally {
        app.endUndoGroup();
    }
}

btnImportMask.onClick = function() {
    app.beginUndoGroup("Import Mask");
    try {
        return safeExecute("importMask", function() {
        var videoFolderName = ProjectVideoFolderName;    
        var videofolder = findProjectFolder(videoFolderName);

        if (videofolder != undefined) {
            var fileFound = false;
            var sourceFile, sourceName, sourcePath;

            for (var i = 1; i <= videofolder.numItems; i++) {
                if (videofolder.item(i).file) {
                    sourceFile = videofolder.item(i).file;
                    sourceName = videofolder.item(i).name;
                    sourcePath = sourceFile.path;

                    var outputName = sourceName.substr(0, sourceName.lastIndexOf(".")) + " Mask" + ".mp4";
                    var outputPath = sourcePath + "/" + outputName;

                    var renderedFile = new File(outputPath);
                    if (renderedFile.exists) {
                        fileFound = true;
                        var importOptions = new ImportOptions(renderedFile);
                        var importedFile = app.project.importFile(importOptions);
                        importedFile.parentFolder = videofolder;

                        var videoComp = findCompByName(COMP_NAMES.VIDEO);

                        if (videoComp != undefined) {
                            var newLayer = videoComp.layers.add(importedFile);
                            newLayer.moveToEnd();
                            newLayer.audioEnabled = false;
                            newLayer.enabled = false;
                            newLayer.selected = false;

                            var sourceLayer;
                            for (var k = 1; k <= videoComp.layers.length; k++) {
                                if (videoComp.layers[k].source && videoComp.layers[k].source.name == sourceName) {
                                    sourceLayer = videoComp.layers[k];
                                    break;
                                }
                            }

                            if (sourceLayer != undefined) {
                                var keylightEffect = sourceLayer.property("Effects").property("Keylight (1.2)");
                                if (keylightEffect != null) {
                                    keylightEffect.enabled = false;
                                }

                                for (var l = 1; l <= sourceLayer.property("ADBE Effect Parade").numProperties; l++) {
                                    var effect = sourceLayer.property("ADBE Effect Parade").property(l);
                                    if (effect.name != "Keylight (1.2)") {
                                        effect.enabled = true;
                                    }
                                }

                                var setMatteEffect = sourceLayer.property("ADBE Effect Parade").property("Set Matte");
                                if (setMatteEffect != undefined) {
                                    setMatteEffect.property("Take Matte From Layer").setValue(videoComp.layers.length);
                                }
                            }
                        }
                        
                        // Делаем композицию Video активной
                        videoComp.openInViewer();
                        break;
                    }
                }
            }
            if (!fileFound) {
                alert("Файл маски не найден.");
            }
        } else {
            alert("Папка с именем " + videoFolderName + " не найдена.");
        }
        return true;
    }, []);
    } finally {
        app.endUndoGroup();
    }
}

btnMoveVideoIn.onClick = function() {
    app.beginUndoGroup("Move Video In");
    try {
        return safeExecute("moveVideoIn", function() {
        var currentComp = app.project.activeItem;
        
        // Проверяем, что активная композиция - это именно "Video"
        if (!currentComp || !(currentComp instanceof CompItem) || currentComp.name !== COMP_NAMES.VIDEO) {
            alert("Сначала откройте композицию 'Video' и установите playhead в нужное место!");
            log("Попытка использовать Move Video In без активной композиции Video", "WARNING");
            return false;
        }
        
        var currentTime = currentComp.time;

        var comp = findCompByName(ComposeName);

        if (comp != null) {
            comp.time = currentTime;
            var layer = comp.layer(COMP_NAMES.VIDEO);

            if (layer != null && layer.source instanceof CompItem) {
                layer.startTime = -comp.time;
                layer.inPoint = 0;
                log("Установлен инпоинт для видео слоя (время: " + currentTime + ")", "SUCCESS");
            } else {
                alert("Убедитесь, что слой 'Video' существует и является композицией.");
            }
            } else {
                alert("Убедитесь, что композиция с именем '" + ComposeName + "' существует.");
            }
        return true;
    }, []);
    } finally {
        app.endUndoGroup();
    }
}

btnMoveVideoInOut.onClick = function() {
    app.beginUndoGroup("Move Video In-Out");
    try {
        return safeExecute("moveVideoInOut", function() {
        log("=== КНОПКА MOVE VIDEO IN-OUT НАЖАТА ===", "INFO");
        var currentComp = app.project.activeItem;
        
        // Проверяем, что активная композиция - это именно "Video"
        if (!currentComp || !(currentComp instanceof CompItem) || currentComp.name !== COMP_NAMES.VIDEO) {
            alert("Сначала откройте композицию 'Video' и установите playhead в нужное место!");
            log("Попытка использовать Move Video In-Out без активной композиции Video", "WARNING");
            return false;
        }
        
        // Запоминаем начальную позицию курсора
        var recordedTime = currentComp.time;
        log("Записано время курсора: " + recordedTime, "INFO");
        
        // Ищем слой VIDEO в композиции Video
        var videoLayer = null;
        for (var i = 1; i <= currentComp.numLayers; i++) {
            if (currentComp.layer(i).name === LAYER_NAMES.VIDEO) {
                videoLayer = currentComp.layer(i);
                break;
            }
        }
        
        if (!videoLayer) {
            alert("Слой 'VIDEO' не найден в композиции Video!");
            log("Слой VIDEO не найден в композиции Video", "ERROR");
            return false;
        }
        
        // Определяем активную длину видео (от inPoint до outPoint)
        var videoInPoint = videoLayer.inPoint;
        var videoOutPoint = videoLayer.outPoint;
        var videoActiveDuration = videoOutPoint - videoInPoint;
        var thirdDuration = videoActiveDuration / 3;
        var isInBeginning = recordedTime <= (videoInPoint + thirdDuration);
        var isInEnd = recordedTime >= (videoOutPoint - thirdDuration);
        
        log("=== ДИАГНОСТИКА ПОЗИЦИИ КУРСОРА ===", "INFO");
        log("Длительность композиции Video: " + currentComp.duration, "INFO");
        log("InPoint видео: " + videoInPoint, "INFO");
        log("OutPoint видео: " + videoOutPoint, "INFO");
        log("Активная длительность видео: " + videoActiveDuration, "INFO");
        log("Треть активной длительности: " + thirdDuration, "INFO");
        log("Позиция курсора: " + recordedTime, "INFO");
        log("Граница начала: " + (videoInPoint + thirdDuration), "INFO");
        log("Граница конца: " + (videoOutPoint - thirdDuration), "INFO");
        log("В начале: " + isInBeginning, "INFO");
        log("В конце: " + isInEnd, "INFO");
        
        
        // Выполняем функционал Move Video In ТОЛЬКО если мы в начале
        if (isInBeginning) {
            var mainComp = findCompByName(ComposeName);

            if (mainComp != null) {
                mainComp.time = recordedTime;
                var videoLayer = mainComp.layer(COMP_NAMES.VIDEO);

                if (videoLayer != null && videoLayer.source instanceof CompItem) {
                    videoLayer.startTime = -mainComp.time;
                    videoLayer.inPoint = 0;
                    log("Выполнен Move Video In (время: " + recordedTime + ")", "SUCCESS");
                } else {
                    alert("Убедитесь, что слой 'Video' существует и является композицией.");
                    return false;
                }
            } else {
                alert("Убедитесь, что композиция с именем '" + ComposeName + "' существует.");
                return false;
            }
        } else {
            log("Курсор не в начале - Move Video In не выполняется", "INFO");
        }
        
        // Находим композицию MeteoCalendarOut
        var outComp = findCompByName(COMP_NAMES.OUT);
        
        if (!outComp) {
            alert("Композиция 'MeteoCalendarOut' не найдена!");
            log("Композиция 'MeteoCalendarOut' не найдена", "ERROR");
            return false;
        }
        
        
        if (isInBeginning) {
            // Работаем с группой IN
            log("Обрабатываем группу IN", "INFO");
            
            // INTRO - обрезаем outPoint
            var introLayer = outComp.layer(LAYER_NAMES.INTRO);
            if (introLayer) {
                introLayer.outPoint = recordedTime;
                log("Обрезан outPoint слоя INTRO в " + recordedTime, "SUCCESS");
            }
            
            // BODY - размещаем начало в записанное положение
            var bodyLayer = outComp.layer(LAYER_NAMES.BODY);
            if (bodyLayer) {
                bodyLayer.startTime = recordedTime;
                log("Размещено начало слоя BODY в " + recordedTime, "SUCCESS");
            }
            
            // Transition 1st - размещаем по маркеру
            var transition1Layer = outComp.layer(LAYER_NAMES.TRANSITION_1ST);
            if (transition1Layer && transition1Layer.marker.numKeys > 0) {
                var markerTime = transition1Layer.marker.keyTime(1);
                var delta = recordedTime - markerTime;
                transition1Layer.startTime += delta;
                log("Размещен Transition 1st по маркеру в " + recordedTime, "SUCCESS");
            }
            
        } else if (isInEnd) {
            // Работаем с группой OUT
            log("=== ОБРАБОТКА ГРУППЫ OUT ===", "INFO");
            log("Курсор в конце композиции Video - обрабатываем группу OUT", "INFO");
            
            // BODY - обрезаем outPoint
            var bodyLayer = outComp.layer(LAYER_NAMES.BODY);
            if (bodyLayer) {
                log("Найден слой BODY, обрезаем outPoint в " + recordedTime, "INFO");
                bodyLayer.outPoint = recordedTime;
                log("Обрезан outPoint слоя BODY в " + recordedTime, "SUCCESS");
            } else {
                log("Слой BODY не найден в композиции MeteoCalendarOut", "ERROR");
            }
            
            // Transition 2nd - размещаем по маркеру
            var transition2Layer = outComp.layer(LAYER_NAMES.TRANSITION_2ND);
            if (transition2Layer) {
                log("Найден слой Transition 2nd", "INFO");
                if (transition2Layer.marker.numKeys > 0) {
                    var markerTime = transition2Layer.marker.keyTime(1);
                    var delta = recordedTime - markerTime;
                    transition2Layer.startTime += delta;
                    log("Размещен Transition 2nd по маркеру в " + recordedTime, "SUCCESS");
                } else {
                    log("У слоя Transition 2nd нет маркеров", "WARNING");
                }
            } else {
                log("Слой Transition 2nd не найден в композиции MeteoCalendarOut", "ERROR");
            }
            
            // Остальные слои группы OUT - перемещаем их существующими inPoint в записанное место
            var outLayers = [LAYER_NAMES.BACKGROUND, LAYER_NAMES.BACKGROUND_OVERLAY, LAYER_NAMES.LOGO, LAYER_NAMES.VIGLETTE];
            log("Обрабатываем остальные слои группы OUT: " + outLayers.join(", "), "INFO");
            var foundLayers = [];
            var missingLayers = [];
            var endTime = recordedTime + TIME_CONFIG.OUT_LAYERS_OFFSET; // Смещение для слоев OUT группы
            
            for (var i = 0; i < outLayers.length; i++) {
                var layer = outComp.layer(outLayers[i]);
                if (layer) {
                    // Перемещаем слой, сохраняя его существующий inPoint
                    var currentInPoint = layer.inPoint;
                    var delta = recordedTime - currentInPoint;
                    layer.startTime += delta;
                    
                    // Устанавливаем outPoint в +6 секунд от записанной позиции
                    layer.outPoint = endTime;
                    
                    foundLayers.push(outLayers[i]);
                    log("Перемещен слой " + outLayers[i] + " в " + recordedTime + " (смещение: " + delta + "), outPoint: " + endTime, "SUCCESS");
                } else {
                    missingLayers.push(outLayers[i]);
                    log("Слой " + outLayers[i] + " не найден в композиции MeteoCalendarOut", "WARNING");
                }
            }
            
            // Устанавливаем Work Area End в +6 секунд от записанной позиции
            var workAreaStart = outComp.workAreaStart;
            var workAreaDuration = endTime - workAreaStart;
            outComp.workAreaDuration = workAreaDuration;
            log("Work Area установлен: Start=" + workAreaStart + ", Duration=" + workAreaDuration + ", End=" + endTime, "SUCCESS");
            
            log("Обработаны слои: " + foundLayers.join(", "), "SUCCESS");
            if (missingLayers.length > 0) {
                log("Не найдены слои: " + missingLayers.join(", "), "WARNING");
            }
            
        } else {
            // Курсор в средней части - не обрабатываем
            log("Курсор в средней части композиции Video - обработка не требуется", "INFO");
        }
        
        log("Завершена обработка Move Video In-Out (время: " + recordedTime + ")", "SUCCESS");
        return true;
    }, []);
    } finally {
        app.endUndoGroup();
    }
}

btnMoveLayers.onClick = function() {
    app.beginUndoGroup("Move Layers");
    try {
        return safeExecute("moveLayers", function() {
        var comp = app.project.activeItem;
        if (comp != null && comp instanceof CompItem) {
            var layers = comp.selectedLayers;
            var latestOutPoint = comp.workAreaStart;
            for (var i = 0; i < layers.length; i++) {
                var layer = layers[i];
                if (layer.marker.numKeys > 0) {
                    var firstMarkerTime = layer.marker.keyTime(1);
                    layer.startTime += comp.time - firstMarkerTime;
                } else {
                    var delta = comp.time - layer.inPoint;
                    layer.startTime += delta;
                }
                if (layer.outPoint > latestOutPoint) {
                    latestOutPoint = layer.outPoint;
                }
            }
            comp.workAreaDuration = latestOutPoint - comp.workAreaStart;
            log("Сдвинуто слоев: " + layers.length, "SUCCESS");
        } else {
            alert("Выберите композит и слои, которые вы хотите сдвинуть.");
        }
        return true;
    }, []);
    } finally {
        app.endUndoGroup();
    }
}

btnOpacity.onClick = function() {
    app.beginUndoGroup("Apply Opacity");
    try {
        return safeExecute("opacity", function() {
        if (app.project.activeItem != null) {
            var comp = app.project.activeItem;
            if (comp.selectedLayers.length > 0) {
                var layer = comp.selectedLayers[0];
                layer.property("ADBE Transform Group").property("ADBE Opacity").setValueAtTime(layer.outPoint - LAYER_CONFIG.OPACITY_FADE_DURATION, LAYER_CONFIG.OPACITY_FULL);
                layer.property("ADBE Transform Group").property("ADBE Opacity").setValueAtTime(layer.outPoint, LAYER_CONFIG.OPACITY_ZERO); 
                comp.openInViewer();
                log("Применена анимация прозрачности к слою: " + layer.name, "SUCCESS");
            } else {
                alert("Выберите слой.");
            }
            } else {
                alert("Откройте композицию.");
            }
        return true;
    }, []);
    } finally {
        app.endUndoGroup();
    }
}

btnScaleAll.onClick = function() {
    app.beginUndoGroup("Scale All");
    try {
        return safeExecute("scaleAll", function() {
        var isScaleDown;
        var sendExpression;

        if (app.project.activeItem != null) {
            var comp = app.project.activeItem;
            var meteoImageIndex = 0;
            for (var i = 1; i <= comp.numLayers; i++) {
                try {
                    var layer = comp.layer(i);
                    if (!layer || !layer.name) {
                        continue;
                    }
                    // Ищем слои с форматом MeteoImage 01, MeteoImage 02 и т.д. (новый формат) или равны MeteoImage (старый формат)
                    var imagePattern = /^MeteoImage (\d{2})$/;
                    if (layer.name.match(imagePattern) || layer.name == LAYER_NAMES.METEO_IMAGE) {
                        meteoImageIndex++;
                        if(meteoImageIndex % 2 == 0) {
                            isScaleDown = false;
                            sendExpression = scaleUpExpression;
                        } else {
                            isScaleDown = true;
                            sendExpression = scaleDownExpression;
                        }
                        ScaleLayer(comp, layer, sendExpression, isScaleDown);
                    }
                } catch (e) {
                    log("Ошибка при обработке слоя " + i + " в ScaleAll: " + e.message, "WARNING");
                    continue;
                }
            }
            log("Применено масштабирование к " + meteoImageIndex + " слоям MeteoImage", "SUCCESS");
            comp.openInViewer();
        } else {
            alert("Откройте композицию.");
        }
        return true;
    }, []);
    } finally {
        app.endUndoGroup();
    }
}

transformButton.onClick = function() {
    app.beginUndoGroup("Flip Transform");
    try {
        return safeExecute("transform", function() {
        if (app.project.activeItem != null) {
            var comp = app.project.activeItem;
            if (comp.selectedLayers.length > 0) {
                var layer = comp.selectedLayers[0];
                
                if (layer.Effects.property("ADBE Geometry2") != null) {
                    layer.Effects.property("ADBE Geometry2").remove();
                }
                
                var transformEffect = layer.Effects.addProperty("ADBE Geometry2");
                var scaleWidth = transformEffect.property("ADBE Geometry2-0004");
                scaleWidth.setValue(LAYER_CONFIG.SCALE_WIDTH_VALUE);

                var uniformScale = layer.property("ADBE Effect Parade").property("ADBE Geometry2").property("ADBE Geometry2-0011");
                uniformScale.setValue(false);
                
                comp.openInViewer();
                log("Применено отражение к слою: " + layer.name, "SUCCESS");
            } else {
                alert("Выберите слой.");
            }
        } else {
            alert("Откройте композицию.");
        }
        return true;
    }, []);
    } finally {
        app.endUndoGroup();
    }
}

btnImportVideo.onClick = function() {
    app.beginUndoGroup("Import Video");
    try {
        return safeExecute("importVideo", function() {
        log("Начало импорта видео", "INFO");
        log("Исходный путь VideoInputPath: " + VideoInputPath, "INFO");
        
        var videoBasePath = resolvePath(VideoInputPath);
        log("Разрешенный путь: " + videoBasePath, "INFO");
        
        var videoBaseFolder = new Folder(videoBasePath);
        log("Проверка существования папки: " + videoBasePath, "INFO");
        
        if (!videoBaseFolder.exists) {
            alert("Папка с видео не найдена: " + videoBasePath);
            log("Папка с видео не найдена: " + videoBasePath, "ERROR");
            return false;
        }
        
        // Получаем все папки и сортируем по номеру
        var folders = videoBaseFolder.getFiles();
        var numberedFolders = [];
        
        for (var i = 0; i < folders.length; i++) {
            var folder = folders[i];
            if (folder instanceof Folder) {
                var folderName = folder.name;
                // Проверяем, что имя папки состоит только из цифр (3-4 знака)
                if (/^\d{3,4}$/.test(folderName)) {
                    numberedFolders.push({
                        name: folderName,
                        path: folder.fsName,
                        number: parseInt(folderName)
                    });
                }
            }
        }
        
        if (numberedFolders.length === 0) {
            alert("Не найдено папок с видео (нумерация 3-4 цифры)");
            log("Не найдено папок с видео в: " + videoBasePath, "WARNING");
            return false;
        }
        
        // Сортируем по номеру и берем последнюю
        numberedFolders.sort(function(a, b) { return a.number - b.number; });
        var latestFolder = numberedFolders[numberedFolders.length - 1];
        
        // Ищем все видеофайлы в последней папке
        var videoFolder = new Folder(latestFolder.path);
        var videoFiles = videoFolder.getFiles();
        var videoFilesList = [];
        
        for (var i = 0; i < videoFiles.length; i++) {
            var file = videoFiles[i];
            if (file instanceof File) {
                var ext = file.name.substr(file.name.lastIndexOf(".")).toLowerCase();
                if (ext === ".mp4" || ext === ".mov" || ext === ".avi" || ext === ".mkv") {
                    videoFilesList.push(file);
                }
            }
        }
        
        if (videoFilesList.length === 0) {
            alert("В папке " + latestFolder.name + " не найдено видеофайлов");
            log("В папке " + latestFolder.name + " не найдено видеофайлов", "WARNING");
            return false;
        }
        
        // Формируем сообщение с информацией о всех файлах
        var today = new Date();
        var todayStr = today.getDate() + "." + (today.getMonth() + 1) + "." + today.getFullYear();
        
        var confirmMessage = "Импорт видео из папки Video/" + latestFolder.name + ":\n\n";
        
        for (var i = 0; i < videoFilesList.length; i++) {
            var file = videoFilesList[i];
            var fileDate = new Date(file.modified);
            var dateStr = fileDate.getDate() + "." + (fileDate.getMonth() + 1) + "." + fileDate.getFullYear();
            var timeStr = fileDate.getHours() + ":" + (fileDate.getMinutes() < 10 ? "0" : "") + fileDate.getMinutes();
            
            // Проверяем, совпадает ли дата с сегодняшней
            if (dateStr === todayStr) {
                dateStr += " СЕГОДНЯ";
            }
            
            confirmMessage += "Файл: " + file.name + "\n";
            confirmMessage += "Дата: " + dateStr + "\n";
            confirmMessage += "Время: " + timeStr + "\n\n";
        }
        
        confirmMessage += "Продолжить импорт всех файлов?";
        
        var confirmResult = confirm(confirmMessage);
        if (!confirmResult) {
            log("Импорт видео отменен пользователем", "INFO");
            return false;
        }
        
        // Импортируем все видеофайлы
        var importedFiles = [];
        for (var i = 0; i < videoFilesList.length; i++) {
            var importOptions = new ImportOptions(videoFilesList[i]);
            var importedFile = app.project.importFile(importOptions);
            importedFiles.push(importedFile);
        }
        
        // Находим папку VideoSrc
        var videoSrcFolder = findProjectFolder(ProjectVideoFolderName);
        
        if (!videoSrcFolder) {
            videoSrcFolder = app.project.items.addFolder(ProjectVideoFolderName);
            log("Создана папка проекта: " + ProjectVideoFolderName, "INFO");
        }
        
        // Перемещаем все импортированные файлы в папку VideoSrc
        for (var i = 0; i < importedFiles.length; i++) {
            importedFiles[i].parentFolder = videoSrcFolder;
        }
        
        // Находим композицию Video
        var videoComp = findCompByName(COMP_NAMES.VIDEO);
        
        if (videoComp) {
            // Ищем слой Holder
            var holderLayer = null;
            for (var i = 1; i <= videoComp.numLayers; i++) {
                if (videoComp.layer(i).name === LAYER_NAMES.HOLDER) {
                    holderLayer = videoComp.layer(i);
                    break;
                }
            }
            
            // Добавляем все видео в композицию
            for (var i = 0; i < importedFiles.length; i++) {
                var newLayer = videoComp.layers.add(importedFiles[i]);
                
                // Переименовываем слой в VIDEO
                newLayer.name = LAYER_NAMES.VIDEO;
                
                if (holderLayer) {
                    newLayer.moveAfter(holderLayer);
                }
                
                newLayer.selected = true;
            }
            
            if (holderLayer) {
                log("Все видео размещены под слоем Holder в композиции Video", "SUCCESS");
            } else {
                log("Слой Holder не найден, все видео размещены в конце композиции Video", "INFO");
            }
            
            // Устанавливаем Work Area End в конец последнего импортированного слоя
            if (importedFiles.length > 0) {
                var lastLayer = videoComp.layer(videoComp.numLayers);
                if (lastLayer) {
                    var workAreaStart = videoComp.workAreaStart;
                    var workAreaDuration = lastLayer.outPoint - workAreaStart;
                    videoComp.workAreaDuration = workAreaDuration;
                    log("Work Area установлен: Start=" + workAreaStart + ", Duration=" + workAreaDuration + ", End=" + lastLayer.outPoint, "SUCCESS");
                }
            }
            
            // Делаем композицию Video активной
            videoComp.openInViewer();
        } else {
            log("Композиция 'Video' не найдена, видео импортированы в папку", "WARNING");
        }
        
        log("Импортировано видеофайлов: " + importedFiles.length + " из папки " + latestFolder.name, "SUCCESS");
        alert("Импортировано " + importedFiles.length + " видеофайлов из папки " + latestFolder.name);
        
        return true;
    }, []);
    } finally {
        app.endUndoGroup();
    }
}




btnOut.onClick = function() {
    app.beginUndoGroup("Add to Render Queue");
    try {
        return safeExecute("renderOut", function() {
        log("Начало экспорта рендера", "INFO");
        log("Исходный путь VideoOutputPath: " + VideoOutputPath, "INFO");
        
        // Создаем папку для рендера
        var previewsPath = resolvePath(VideoOutputPath);
        log("Разрешенный путь для рендера: " + previewsPath, "INFO");
        
        var previewsFolder = new Folder(previewsPath);
        
        if (!previewsFolder.exists) {
            previewsFolder.create();
            log("Создана папка Previews: " + previewsPath, "INFO");
        }
        
        // Получаем все папки и находим пронумерованные
        var folders = previewsFolder.getFiles();
        var numberedFolders = [];
        
        for (var i = 0; i < folders.length; i++) {
            var folder = folders[i];
            if (folder instanceof Folder) {
                var folderName = folder.name;
                if (/^\d+$/.test(folderName)) {
                    numberedFolders.push({
                        number: parseInt(folderName),
                        name: folderName,
                        path: folder.fsName,
                        folder: folder
                    });
                }
            }
        }
        
        // Определяем папку для рендера
        var targetFolderPath = null;
        var targetFolderNumber = null;
        
        if (numberedFolders.length > 0) {
            // Сортируем по номеру и берем последнюю
            numberedFolders.sort(function(a, b) { return a.number - b.number; });
            var latestFolder = numberedFolders[numberedFolders.length - 1];
            
            // Проверяем, пуста ли последняя папка
            var latestFolderObj = new Folder(latestFolder.path);
            var filesInLatest = latestFolderObj.getFiles();
            var isEmpty = filesInLatest.length === 0;
            
            if (isEmpty) {
                // Используем последнюю папку, если она пуста
                targetFolderPath = latestFolder.path;
                targetFolderNumber = latestFolder.number;
                log("Последняя папка '" + latestFolder.name + "' пуста, используем её для рендера", "INFO");
            } else {
                // Создаем новую папку с следующим номером
                targetFolderNumber = latestFolder.number + 1;
                targetFolderPath = previewsPath + "/" + targetFolderNumber;
                var newFolder = new Folder(targetFolderPath);
                newFolder.create();
                log("Последняя папка '" + latestFolder.name + "' не пуста (" + filesInLatest.length + " файлов), создана новая папка: " + targetFolderNumber, "INFO");
            }
        } else {
            // Если папок нет, создаем первую
            targetFolderNumber = 1;
            targetFolderPath = previewsPath + "/" + targetFolderNumber;
            var newFolder = new Folder(targetFolderPath);
            newFolder.create();
            log("Пронумерованных папок не найдено, создана первая папка: " + targetFolderNumber, "INFO");
        }
        
        log("Папка для рендера: " + targetFolderPath, "SUCCESS");
        
        var renderQueue = app.project.renderQueue;
        var addedItems = 0;
        
        // Ищем композиции
        var meteoOutComp = findCompByName(COMP_NAMES.OUT);
        var instagramComp = findCompByName(COMP_NAMES.INSTAGRAM);
        
        // Добавляем MeteoCalendarOut в очередь рендера
        if (meteoOutComp != null) {
            var renderItem1 = renderQueue.items.add(meteoOutComp);
            
            applyRenderTemplateWithFallback(renderItem1.outputModule(1), RenderTemplate1, "H.264");
            
            renderItem1.outputModule(1).audioEnabled = false;
            var outputFile1 = new File(targetFolderPath + "/MeteoCalendarOut.mp4");
            renderItem1.outputModule(1).file = outputFile1;
            addedItems++;
            log("Добавлена в очередь рендера: MeteoCalendarOut -> " + outputFile1.fsName, "SUCCESS");
        } else {
            log("Композиция 'MeteoCalendarOut' не найдена", "WARNING");
        }
        
        // Добавляем MeteoCalendar Instagram в очередь рендера
        if (instagramComp != null) {
            var renderItem2 = renderQueue.items.add(instagramComp);
            var outputModule = renderItem2.outputModule(1);
            
            // Пробуем применить шаблон JPEG, если не получается - не страшно
            applyRenderTemplateWithFallback(outputModule, RenderTemplate2, "JPEG");
            
            outputModule.audioEnabled = false;
            
            // КЛЮЧЕВОЙ МОМЕНТ: добавляем [#####] к имени файла для автоматической нумерации
            var outputFile2 = new File(targetFolderPath + "/MeteoCalendar_Instagram_[#####].jpg");
            outputModule.file = outputFile2;
            
            addedItems++;
            log("Добавлена в очередь рендера: MeteoCalendar Instagram -> " + outputFile2.fsName, "SUCCESS");
            
        } else {
            log("Композиция 'MeteoCalendar Instagram' не найдена", "WARNING");
        }
        
        if (addedItems > 0) {
            var relativeRenderPath = VideoOutputPath + "/" + targetFolderNumber;
            alert("Добавлено в очередь рендера: " + addedItems + " композиций\nПапка: " + relativeRenderPath + 
                  "\n\nДля Instagram будет создана JPEG секвенция с нумерацией кадров");
            log("Всего добавлено в очередь рендера: " + addedItems + " композиций", "SUCCESS");
        } else {
            alert("Не найдено композиций для рендера!");
            log("Не найдено композиций для рендера", "ERROR");
        }
        
        return true;
    }, []);
    } finally {
        app.endUndoGroup();
    }
}




function ScaleLayer(comp, layer, scaleExpression, isScaleDown) {
    return safeExecute("scaleLayer", function() {        
        if (layer.Effects.property("ADBE Gaussian Blur 2") != null) {
            layer.Effects.property("ADBE Gaussian Blur 2").remove();
        }
        
        if (layer.Effects.property("CC RepeTile") != null) {
            layer.Effects.property("CC RepeTile").remove();
        }

        var MatteChoker = layer.Effects.addProperty("Matte Choker");
        
        var RepeTile = layer.Effects.addProperty("CC RepeTile");
        RepeTile.property("CC RepeTile-0001").setValue(EFFECT_CONFIG.REPETILE.WIDTH);
        RepeTile.property("CC RepeTile-0002").setValue(EFFECT_CONFIG.REPETILE.HEIGHT);
        RepeTile.property("CC RepeTile-0003").setValue(EFFECT_CONFIG.REPETILE.WIDTH);
        RepeTile.property("CC RepeTile-0004").setValue(EFFECT_CONFIG.REPETILE.HEIGHT);
        RepeTile.property("CC RepeTile-0005").setValue(EFFECT_CONFIG.REPETILE.EDGE);

        var blurEffect = layer.Effects.addProperty("ADBE Gaussian Blur 2");
        var blur = blurEffect.property("Blurriness");
        blur.expression = EXPRESSION_CONFIG.BLUR_LINEAR;

        var ScaleControl = layer.Effects.addProperty("ADBE Slider Control");
        ScaleControl.property("ADBE Slider Control-0001").setValue(EFFECT_CONFIG.SCALE.MULT);
        ScaleControl.name = "ScaleMult";

        var InitScaleControl = layer.Effects.addProperty("ADBE Slider Control");
        InitScaleControl.property("ADBE Slider Control-0001").setValue(EFFECT_CONFIG.SCALE.INITIAL_MULT);
        InitScaleControl.name = "InitialScaleMult";

        layer.outPoint = layer.inPoint + TIME_CONFIG.METEO_IMAGE_DURATION + comp.frameDuration;
        
        layer.property("ADBE Transform Group").property("ADBE Position").dimensionsSeparated = true;

        var xPos = layer.property("ADBE Transform Group").property("ADBE Position_0");
        var yPos = layer.property("ADBE Transform Group").property("ADBE Position_1");

        if (xPos.numKeys > 0) {
            for (var i = xPos.numKeys; i > 0; i--) {
                xPos.removeKey(i);
            }
        }

        if (yPos.numKeys > 0) {
            for (var i = yPos.numKeys; i > 0; i--) {
                yPos.removeKey(i);
            }
        }
        
        xPos.setValueAtTime(layer.inPoint, comp.width/2);
        xPos.setValueAtTime(layer.outPoint - comp.frameDuration, comp.width/2);
        
        yPos.setValueAtTime(layer.inPoint, comp.height/2);
        yPos.setValueAtTime(layer.outPoint - comp.frameDuration, comp.height/2);
        
        layer.property("Scale").expression = scaleExpression;
        layer.property("Rotation").expression = EXPRESSION_CONFIG.ROTATION_WIGGLE;
        
        log("Применено масштабирование к слою: " + layer.name, "INFO");
        return true;
    }, []);
}

/**
 * Поиск папки проекта по имени
 * @param {String} folderName - имя папки для поиска
 * @returns {FolderItem|null} найденная папка или null
 */
function findProjectFolder(folderName) {
    return safeExecute("findProjectFolder", function() {
        for (var i = 1; i <= app.project.numItems; i++) {
            try {
                var item = app.project.item(i);
                if (item instanceof FolderItem && item.name === folderName) {
                    return item;
                }
            } catch (e) {
                continue;
            }
        }
        return null;
    }, []);
}

/**
 * Поиск композиции по имени в проекте
 * @param {String} compName - имя композиции
 * @returns {CompItem|null} найденная композиция или null
 * 
 * ⚠️ ВОЗМОЖНАЯ ОПТИМИЗАЦИЯ: Для больших проектов (>1000 элементов) рекомендуется
 * кэширование результатов поиска. См. рекомендации в Script Analytics/Code_Quality_v1.3.md
 */
function findCompByName(compName) {
    return safeExecute("findCompByName", function() {
        var comp = null;
        for (var i = 1; i <= app.project.numItems; i++) {
            if (app.project.item(i).name === compName && app.project.item(i) instanceof CompItem) {
                comp = app.project.item(i);
                break;
            }
        }
        return comp;
    }, []);
}

// === PATCH: ВАЛИДАЦИЯ СТРУКТУРЫ ПРОЕКТА ===
/**
 * Проверяет структуру проекта на наличие критических композиций и слоев
 * @returns {Boolean} true если структура валидна, false если есть проблемы
 */
function validateProjectStructure() {
    var issues = [];
    
    // Проверка главной композиции
    var mainComp = findCompByName(COMP_NAMES.MAIN);
    if (!mainComp) {
        issues.push("❌ Не найдена главная композиция: '" + COMP_NAMES.MAIN + "'");
    } else {
        // Проверка слоя VIDEO в главной композиции
        var videoLayer = null;
        try {
            videoLayer = mainComp.layer(COMP_NAMES.VIDEO);
            if (!videoLayer) {
                issues.push("⚠️ В композиции '" + COMP_NAMES.MAIN + "' не найден слой '" + COMP_NAMES.VIDEO + "'");
            }
        } catch (e) {
            issues.push("⚠️ В композиции '" + COMP_NAMES.MAIN + "' не найден слой '" + COMP_NAMES.VIDEO + "'");
        }
        
        // Проверка масок с правильным label
        var maskCount = 0;
        var wrongLabelMasks = [];
        for (var i = 1; i <= mainComp.numLayers; i++) {
            try {
                var layer = mainComp.layer(i);
                if (layer && layer.name && layer.name.indexOf(LAYER_NAMES.METEO_MASK) === 0) {
                    maskCount++;
                    if (layer.label !== LAYER_CONFIG.MASK_LABEL) {
                        wrongLabelMasks.push(layer.name + " (label=" + layer.label + ", должен быть " + LAYER_CONFIG.MASK_LABEL + ")");
                    }
                }
            } catch (e) {
                continue;
            }
        }
        
        if (wrongLabelMasks.length > 0) {
            issues.push("⚠️ Найдены маски с неправильным label (" + wrongLabelMasks.length + "):\n   " + wrongLabelMasks.slice(0, 3).join("\n   ") + (wrongLabelMasks.length > 3 ? "\n   ... и еще " + (wrongLabelMasks.length - 3) : ""));
        }
        
        if (maskCount === 0) {
            issues.push("⚠️ В композиции '" + COMP_NAMES.MAIN + "' не найдено масок с именем '" + LAYER_NAMES.METEO_MASK + " XX'");
        }
    }
    
    // Проверка композиции Video
    var videoComp = findCompByName(COMP_NAMES.VIDEO);
    if (!videoComp) {
        issues.push("⚠️ Не найдена композиция: '" + COMP_NAMES.VIDEO + "' (некоторые функции могут не работать)");
    } else {
        // Проверка слоя HOLDER в композиции Video
        var holderFound = false;
        for (var i = 1; i <= videoComp.numLayers; i++) {
            try {
                var layer = videoComp.layer(i);
                if (layer && layer.name === LAYER_NAMES.HOLDER) {
                    holderFound = true;
                    break;
                }
            } catch (e) {
                continue;
            }
        }
        if (!holderFound) {
            issues.push("⚠️ В композиции '" + COMP_NAMES.VIDEO + "' не найден слой '" + LAYER_NAMES.HOLDER + "'");
        }
    }
    
    // Проверка композиции OUT (опционально, но желательно)
    var outComp = findCompByName(COMP_NAMES.OUT);
    if (!outComp) {
        issues.push("⚠️ Не найдена композиция: '" + COMP_NAMES.OUT + "' (функция рендера может не работать)");
    } else {
        // Проверка критических слоев в OUT
        var requiredLayers = [
            LAYER_NAMES.INTRO,
            LAYER_NAMES.BODY,
            LAYER_NAMES.TRANSITION_1ST,
            LAYER_NAMES.TRANSITION_2ND
        ];
        var missingLayers = [];
        for (var j = 0; j < requiredLayers.length; j++) {
            var layerName = requiredLayers[j];
            var found = false;
            try {
                var layer = outComp.layer(layerName);
                if (layer) found = true;
            } catch (e) {
                // Слой не найден
            }
            if (!found) {
                missingLayers.push(layerName);
            }
        }
        if (missingLayers.length > 0) {
            issues.push("⚠️ В композиции '" + COMP_NAMES.OUT + "' отсутствуют слои: " + missingLayers.join(", "));
        }
    }
    
    // Вывод результатов
    if (issues.length > 0) {
        var message = "Обнаружены проблемы в структуре проекта:\n\n" + issues.join("\n\n");
        message += "\n\n⚠️ ВНИМАНИЕ: Некоторые функции могут работать некорректно!";
        log(message, "WARNING");
        // Не блокируем запуск, только предупреждаем
        // alert(message);
        return false;
    }
    
    log("✅ Структура проекта валидна", "SUCCESS");
    return true;
}

// === PATCH 7: ИНИЦИАЛИЗАЦИЯ ЛОГИРОВАНИЯ ПРИ ЗАПУСКЕ ===
log("=== СКРИПТ METEO CALENDAR ЗАПУЩЕН ===", "SYSTEM");
log("After Effects версия: " + app.version, "SYSTEM");
log("Путь к изображениям: " + folderPath, "SYSTEM");
log("Путь к бэкапу: " + backupFolderPath, "SYSTEM");
log("Путь к видео: " + VideoInputPath, "SYSTEM");
log("Путь для рендера: " + VideoOutputPath, "SYSTEM");
log("Шаблон рендера 1: " + RenderTemplate1, "SYSTEM");
log("Шаблон рендера 2: " + RenderTemplate2, "SYSTEM");

// Валидация структуры проекта при запуске
validateProjectStructure();

win.show();

log("Интерфейс скрипта отображен", "SYSTEM");
