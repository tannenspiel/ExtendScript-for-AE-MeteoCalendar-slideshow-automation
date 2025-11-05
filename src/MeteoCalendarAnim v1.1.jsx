// === PATCH 1: ДОБАВЛЕНИЕ КОНФИГУРАЦИИ И ЛОГИРОВАНИЯ ===
var config = {
    logFile: "D:/WORK_online/METEO_TV/243_MeteoCalendar/script_log.txt",
    maxLogSize: 10000
};

// Функция логирования
function log(message, type) {
    var now = new Date();
    var timestamp = now.getFullYear() + "-" + 
                   (now.getMonth() + 1) + "-" + 
                   now.getDate() + " " + 
                   now.getHours() + ":" + 
                   now.getMinutes() + ":" + 
                   now.getSeconds();
    var logEntry = "[" + timestamp + "] " + (type ? type + ": " : "") + message + "\n";
    
    try {
        var logFile = new File(config.logFile);
        
        if (logFile.exists && logFile.length > config.maxLogSize) {
            logFile.remove();
        }
        
        logFile.open("a");
        logFile.write(logEntry);
        logFile.close();
        
    } catch (e) {
        $.writeln(logEntry);
    }
}

// Обработчик ошибок
function safeExecute(funcName, func, args) {
    try {
        log("Выполнение функции: " + funcName, "INFO");
        var result = func.apply(null, args);
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

// Функция для преобразования относительных путей в абсолютные
function resolvePath(relativePath) {
    if (!relativePath || relativePath === "") {
        log("Пустой путь для разрешения", "WARNING");
        return relativePath;
    }
    
    if (relativePath.indexOf("./") === 0 || relativePath.indexOf("../") === 0) {
        // Получаем путь к проекту After Effects
        var projectFile = app.project.file;
        if (projectFile) {
            var projectPath = projectFile.path;
            // Получаем родительскую папку проекта (убираем последнюю папку из пути)
            var parentPath = projectPath.substr(0, projectPath.lastIndexOf("/"));
            var resolvedPath = parentPath + "/" + relativePath;
            log("Разрешен относительный путь: " + relativePath + " -> " + resolvedPath, "INFO");
            log("Путь проекта: " + projectPath, "INFO");
            log("Родительская папка: " + parentPath, "INFO");
            return resolvedPath;
        } else {
            // Если проект не сохранен, используем текущую рабочую директорию
            log("Проект не сохранен, используем относительный путь: " + relativePath, "WARNING");
            return relativePath;
        }
    }
    log("Используется абсолютный путь: " + relativePath, "INFO");
    return relativePath; // Уже абсолютный путь
}

// Валидация путей
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

// === PATCH 2: ОПТИМИЗАЦИЯ ВЫРАЖЕНИЙ МАСШТАБИРОВАНИЯ ===
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
var win = new Window("palette", "Meteo Calendar v 1.1", undefined);
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
    
    var txtFolderPath = grpPathsFields.add('edittext', undefined, "./MapsTemp");
    txtFolderPath.size = [250, 20];
    
    var txtBackupFolderPath = grpPathsFields.add('edittext', undefined, "./MapsTempOld");
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
    
    var txtProjectFolder = grpNamesFields.add('edittext', undefined, "MapsTemp");
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
    

    var grpImport = mainTab.add("group", undefined, "Variables"); 
    grpImport.orientation = "row";
    grpImport.alignChildren = ['fill','fill'];
    
        var btnImportImage = grpImport.add("button", undefined, "Import Image");
                btnImportImage.size = [250,25];
        var importCheck = grpImport.add("checkbox", undefined, "Import All");
        importCheck.value = false;

    var btnPlaceImage = mainTab.add("button", undefined, "Place Image");
            btnPlaceImage.size = [250,25];

    var grpClear = mainTab.add("group", undefined, "grpClear");  
    grpClear.orientation = "row";
    grpClear.alignChildren = ['fill','fill'];
    
        var btnClearImages = grpClear.add("button", undefined, "Clear Project");
            btnClearImages.size = [250,25];

        var clearCheck = grpClear.add("checkbox", undefined, "Enable Clear");
        clearCheck.value = false;


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

var TimeLength = 17;

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

// === ОБНОВЛЕННЫЙ ОБРАБОТЧИК CLEAR PROJECT ===
btnClearImages.onClick = function() {     
    safeExecute("clearImages", function() {
        if (!clearCheck.value) {
            alert("Сначала включите чекбокс 'Enable Clear'!");
            return false;
        }
        
        log("=== ЗАПУСК УЛУЧШЕННОЙ ОЧИСТКИ ===", "INFO");
        
        var resolvedFolderPath = resolvePath(folderPath);
        var resolvedBackupPath = resolvePath(backupFolderPath);
        
        // Создаем бэкап проекта AE
        createBackupAEProject();
        
        // Используем универсальный метод очистки
        var cleanupSuccess = universalCleanup(resolvedFolderPath, resolvedBackupPath);
        
        if (cleanupSuccess) {
            // Очищаем проект AE
            clearMeteoImageLayers();
            clearProjectFolder();
            
            // Проверяем результат
            var finalCheck = new Folder(resolvedFolderPath);
            var filesAfterCleanup = finalCheck.getFiles ? finalCheck.getFiles().length : 0;
            
            if (filesAfterCleanup === 0) {
                alert("✅ Очистка завершена успешно!\n\nВсе файлы удалены через системные команды.");
                log("Очистка завершена успешно", "SUCCESS");
            } else {
                alert("⚠️ Частичный успех\n\nОсталось файлов: " + filesAfterCleanup + "\n\nВозможно, некоторые файлы заблокированы системой.");
                log("Осталось файлов после очистки: " + filesAfterCleanup, "WARNING");
            }
        } else {
            alert("❌ Очистка не удалась\n\nПопробуйте вручную открыть папку в Explorer и запустить очистку снова.");
            log("Очистка не удалась", "ERROR");
        }
        
        return cleanupSuccess;
    }, []);
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

function standardCleanup(folderPath, backupPath) {
    return safeExecute("standardCleanup", function() {
        try {
            var folder = new Folder(folderPath);
            var backupFolder = new Folder(backupPath);
            
            if (!folder.exists) {
                log("Основная папка не существует", "INFO");
                return true;
            }
            
            // Создаем бэкап папку если нужно
            if (!backupFolder.exists) {
                backupFolder.create();
            }
            
            // Копируем файлы
            var files = folder.getFiles();
            var copiedCount = 0;
            
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                if (file instanceof File) {
                    var destFile = new File(backupPath + "/" + file.name);
                    file.copy(destFile);
                    copiedCount++;
                }
            }
            
            log("Скопировано файлов стандартным методом: " + copiedCount, "INFO");
            
            // Очищаем папку
            var clearedCount = 0;
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                if (file instanceof File && file.remove()) {
                    clearedCount++;
                }
            }
            
            log("Удалено файлов стандартным методом: " + clearedCount, "INFO");
            
            return clearedCount > 0 || files.length === 0;
            
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
            var removedCount = 0;
            for (var i = comp.numLayers; i >= 1; i--) {
                var layer = comp.layer(i);
                if (layer.name == "MeteoImage") {
                    layer.remove();
                    removedCount++;
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

        if (projfolder != undefined) {
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
        
        if (videofolder != undefined) {              
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
            var backupProjectName = "MeteoCalendarOutOld.aep";
        
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
    safeExecute("importImages", ImportImages, []);
}

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
                            var importOptions = new ImportOptions(file);
                            var importedFile = app.project.importFile(importOptions);
                            importedFile.parentFolder = projectFolder;
                            importedFile.selected = true;
                            importedCount++;
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
                        deselectFolderElements();
                        var importOptions = new ImportOptions(latestFile);
                        var importedFile = app.project.importFile(importOptions);
                        importedFile.parentFolder = projectFolder;                    
                        importedFile.selected = true;
                        importedCount = 1;
                        
                        log("Импортирован файл: " + latestFile.name, "SUCCESS");
                        alert("Файл " + latestFile.name + " импортирован.");
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
btnPlaceImage.onClick = function() {
    safeExecute("placeImage", function() {
        var compName = ComposeName;
        var mainComp = findCompByName(compName);

        if (mainComp) {
            mainComp.openInViewer();

            var selectedLayers = mainComp.selectedLayers;

            var folderName = ProjectFolderName;
            var folder = null;

            for (var i = 1; i <= app.project.numItems; i++) {
                if ((app.project.item(i) instanceof FolderItem) && (app.project.item(i).name == folderName)) {
                    folder = app.project.item(i);
                    break;
                }
            }

            if (folder == null) {
                throw new Error('Папка "' + folderName + '" не найдена в проекте.');
            }

            var selectedItems = [];
            for (var i = 1; i <= folder.numItems; i++) {
                if (folder.item(i).selected) {
                    selectedItems.push(folder.item(i));
                }
            }

            if (selectedLayers.length == 1 && selectedItems.length > 0) {
                if (selectedLayers[0].name.indexOf("Mask") != -1) {
                    for (var j = 0; j < selectedItems.length; j++) {
                        var newLayer = mainComp.layers.add(selectedItems[j]);
                        newLayer.name = "MeteoImage";
                        newLayer.moveAfter(selectedLayers[0]);
                        newLayer.inPoint = selectedLayers[0].inPoint;
                        newLayer.trackMatteType = TrackMatteType.ALPHA;
                        newLayer.setTrackMatte(selectedLayers[0], TrackMatteType.ALPHA);
                        selectedLayers[0].outPoint = selectedLayers[0].inPoint + TimeLength + mainComp.frameDuration;
                        newLayer.outPoint = selectedLayers[0].inPoint + TimeLength + mainComp.frameDuration;
                        newLayer.selected = true;
                        mainComp.openInViewer();
                    }
                    log("Размещено изображений: " + selectedItems.length, "SUCCESS");
                } else {
                    throw new Error('Выберите слой маски в композиции "' + compName + '".');
                }
            } else {
                throw new Error('Выберите:\n 1. Один слой в композиции "' + compName + '"\n 2. Элемент в папке проекта "' + ProjectFolderName + '".');
            }
        } else {
            throw new Error('Композиция "' + compName + '" не найдена в проекте.');
        }
        return true;
    }, []);
}

// Остальные функции (btnMatte, btnOutMask, btnImportMask, btnMoveVideoIn, btnMoveLayers, 
// btnOpacity, btnScaleDown, btnScaleUp, btnScaleAll, transformButton) 
// оборачиваются аналогичным образом...

btnScaleDown.onClick = function() {
    safeExecute("scaleDown", function() {
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
}

btnScaleUp.onClick = function() {
    safeExecute("scaleUp", function() {
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
}

// === PATCH 8: ДОБАВЛЕНИЕ ОТСУТСТВУЮЩИХ ОБРАБОТЧИКОВ КНОПОК ===
btnMatte.onClick = function() {
    safeExecute("matte", function() {
        if (app.project.activeItem != null) {
            var comp = app.project.activeItem;
            if (comp.selectedLayers.length > 0) {
                var layer = comp.selectedLayers[0];
                
                var KeyLight = layer.Effects.addProperty("Keylight (1.2)");            
                
                var hexColor = "2A52D9";        
                var r = parseInt(hexColor.substr(0,2), 16) / 255;
                var g = parseInt(hexColor.substr(2,2), 16) / 255;
                var b = parseInt(hexColor.substr(4,2), 16) / 255;
                
                KeyLight.property("Screen Colour").setValue([r,g,b]);
                KeyLight.property("View").setValue(5);
                KeyLight.property("Screen Balance").setValue(95);
                KeyLight.property("Clip Black").setValue(25);
                KeyLight.property("Clip White").setValue(60);
                
                var SetMatte = layer.Effects.addProperty("Set Matte");
                SetMatte.property("Use For Matte").setValue(5);
                SetMatte.enabled = false;
                
                var AdvSpillSuppressor = layer.Effects.addProperty("Advanced Spill Suppressor");        
                AdvSpillSuppressor.enabled = false;
                
                var MatteChoker = layer.Effects.addProperty("Matte Choker");
                MatteChoker.property("Choke 1").setValue(25);
                MatteChoker.property("Gray Level Softness 1").setValue(0.35);  
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
}

btnOutMask.onClick = function() {
    safeExecute("outMask", function() {
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
                renderQueueItem.outputModule(1).applyTemplate("H.264 - Match Render Settings - 5 Mbps");
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
}

btnImportMask.onClick = function() {
    safeExecute("importMask", function() {
        var videoFolderName = ProjectVideoFolderName;    
        var videofolder;

        for (var i = 1; i <= app.project.numItems; i++) {
            if ((app.project.item(i) instanceof FolderItem) && (app.project.item(i).name == videoFolderName)) {
                videofolder = app.project.item(i);
                break;
            }
        }

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

                        var videoComp;
                        for (var j = 1; j <= app.project.numItems; j++) {
                            if (app.project.item(j) instanceof CompItem && app.project.item(j).name == "Video") {
                                videoComp = app.project.item(j);
                                break;
                            }
                        }

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
}

btnMoveVideoIn.onClick = function() {
    safeExecute("moveVideoIn", function() {
        var currentComp = app.project.activeItem;
        
        // Проверяем, что активная композиция - это именно "Video"
        if (!currentComp || !(currentComp instanceof CompItem) || currentComp.name !== "Video") {
            alert("Сначала откройте композицию 'Video' и установите playhead в нужное место!");
            log("Попытка использовать Move Video In без активной композиции Video", "WARNING");
            return false;
        }
        
        var currentTime = currentComp.time;

        var comp = null;
        for (var i = 1; i <= app.project.numItems; i++) {
            if (app.project.item(i).name == ComposeName && app.project.item(i) instanceof CompItem) {
                comp = app.project.item(i);
                break;
            }
        }

        if (comp != null) {
            comp.time = currentTime;
            var layer = comp.layer("Video");

            if (layer != null && layer.source instanceof CompItem) {
                app.beginUndoGroup("Установка инпоинта");
                layer.startTime = -comp.time;
                layer.inPoint = 0;
                app.endUndoGroup();
                log("Установлен инпоинт для видео слоя (время: " + currentTime + ")", "SUCCESS");
            } else {
                alert("Убедитесь, что слой 'Video' существует и является композицией.");
            }
        } else {
            alert("Убедитесь, что композиция с именем '" + ComposeName + "' существует.");
        }
        return true;
    }, []);
}

btnMoveVideoInOut.onClick = function() {
    safeExecute("moveVideoInOut", function() {
        log("=== КНОПКА MOVE VIDEO IN-OUT НАЖАТА ===", "INFO");
        var currentComp = app.project.activeItem;
        
        // Проверяем, что активная композиция - это именно "Video"
        if (!currentComp || !(currentComp instanceof CompItem) || currentComp.name !== "Video") {
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
            if (currentComp.layer(i).name === "VIDEO") {
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
            var mainComp = null;
            for (var i = 1; i <= app.project.numItems; i++) {
                if (app.project.item(i).name == ComposeName && app.project.item(i) instanceof CompItem) {
                    mainComp = app.project.item(i);
                    break;
                }
            }

            if (mainComp != null) {
                mainComp.time = recordedTime;
                var videoLayer = mainComp.layer("Video");

                if (videoLayer != null && videoLayer.source instanceof CompItem) {
                    app.beginUndoGroup("Установка инпоинта видео");
                    videoLayer.startTime = -mainComp.time;
                    videoLayer.inPoint = 0;
                    app.endUndoGroup();
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
        var outComp = null;
        for (var i = 1; i <= app.project.numItems; i++) {
            if (app.project.item(i).name === "MeteoCalendarOut" && app.project.item(i) instanceof CompItem) {
                outComp = app.project.item(i);
                break;
            }
        }
        
        if (!outComp) {
            alert("Композиция 'MeteoCalendarOut' не найдена!");
            log("Композиция 'MeteoCalendarOut' не найдена", "ERROR");
            return false;
        }
        
        app.beginUndoGroup("Move Video In-Out");
        
        if (isInBeginning) {
            // Работаем с группой IN
            log("Обрабатываем группу IN", "INFO");
            
            // INTRO - обрезаем outPoint
            var introLayer = outComp.layer("INTRO");
            if (introLayer) {
                introLayer.outPoint = recordedTime;
                log("Обрезан outPoint слоя INTRO в " + recordedTime, "SUCCESS");
            }
            
            // BODY - размещаем начало в записанное положение
            var bodyLayer = outComp.layer("BODY");
            if (bodyLayer) {
                bodyLayer.startTime = recordedTime;
                log("Размещено начало слоя BODY в " + recordedTime, "SUCCESS");
            }
            
            // Transition 1st - размещаем по маркеру
            var transition1Layer = outComp.layer("Transition 1st");
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
            var bodyLayer = outComp.layer("BODY");
            if (bodyLayer) {
                log("Найден слой BODY, обрезаем outPoint в " + recordedTime, "INFO");
                bodyLayer.outPoint = recordedTime;
                log("Обрезан outPoint слоя BODY в " + recordedTime, "SUCCESS");
            } else {
                log("Слой BODY не найден в композиции MeteoCalendarOut", "ERROR");
            }
            
            // Transition 2nd - размещаем по маркеру
            var transition2Layer = outComp.layer("Transition 2nd");
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
            var outLayers = ["Background", "Background Overlay", "Logo Meteo", "Viglette"];
            log("Обрабатываем остальные слои группы OUT: " + outLayers.join(", "), "INFO");
            var foundLayers = [];
            var missingLayers = [];
            var endTime = recordedTime + 6; // +6 секунд от записанной позиции
            
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
        
        app.endUndoGroup();
        log("Завершена обработка Move Video In-Out (время: " + recordedTime + ")", "SUCCESS");
        return true;
    }, []);
}

btnMoveLayers.onClick = function() {
    safeExecute("moveLayers", function() {
        var comp = app.project.activeItem;
        if (comp != null && comp instanceof CompItem) {
            var layers = comp.selectedLayers;
            var latestOutPoint = comp.workAreaStart;
            app.beginUndoGroup("Сдвиг слоев");
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
            app.endUndoGroup();
            log("Сдвинуто слоев: " + layers.length, "SUCCESS");
        } else {
            alert("Выберите композит и слои, которые вы хотите сдвинуть.");
        }
        return true;
    }, []);
}

btnOpacity.onClick = function() {
    safeExecute("opacity", function() {
        if (app.project.activeItem != null) {
            var comp = app.project.activeItem;
            if (comp.selectedLayers.length > 0) {
                var layer = comp.selectedLayers[0];
                layer.property("ADBE Transform Group").property("ADBE Opacity").setValueAtTime(layer.outPoint-2, 100);
                layer.property("ADBE Transform Group").property("ADBE Opacity").setValueAtTime(layer.outPoint, 0); 
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
}

btnScaleAll.onClick = function() {
    safeExecute("scaleAll", function() {
        var isScaleDown;
        var sendExpression;

        if (app.project.activeItem != null) {
            var comp = app.project.activeItem;
            var meteoImageIndex = 0;
            for (var i = 1; i <= comp.numLayers; i++) {
                var layer = comp.layer(i);
                if (layer.name == "MeteoImage") {
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
            }
            log("Применено масштабирование к " + meteoImageIndex + " слоям MeteoImage", "SUCCESS");
            comp.openInViewer();
        } else {
            alert("Откройте композицию.");
        }
        return true;
    }, []);
}

transformButton.onClick = function() {
    safeExecute("transform", function() {
        if (app.project.activeItem != null) {
            var comp = app.project.activeItem;
            if (comp.selectedLayers.length > 0) {
                var layer = comp.selectedLayers[0];
                
                if (layer.Effects.property("ADBE Geometry2") != null) {
                    layer.Effects.property("ADBE Geometry2").remove();
                }
                
                var transformEffect = layer.Effects.addProperty("ADBE Geometry2");
                var scaleWidth = transformEffect.property("ADBE Geometry2-0004");
                scaleWidth.setValue(-100);

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
}

btnImportVideo.onClick = function() {
    safeExecute("importVideo", function() {
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
        var videoSrcFolder = null;
        for (var i = 1; i <= app.project.numItems; i++) {
            if ((app.project.item(i) instanceof FolderItem) && (app.project.item(i).name === ProjectVideoFolderName)) {
                videoSrcFolder = app.project.item(i);
                break;
            }
        }
        
        if (!videoSrcFolder) {
            videoSrcFolder = app.project.items.addFolder(ProjectVideoFolderName);
            log("Создана папка проекта: " + ProjectVideoFolderName, "INFO");
        }
        
        // Перемещаем все импортированные файлы в папку VideoSrc
        for (var i = 0; i < importedFiles.length; i++) {
            importedFiles[i].parentFolder = videoSrcFolder;
        }
        
        // Находим композицию Video
        var videoComp = null;
        for (var i = 1; i <= app.project.numItems; i++) {
            if (app.project.item(i).name === "Video" && app.project.item(i) instanceof CompItem) {
                videoComp = app.project.item(i);
                break;
            }
        }
        
        if (videoComp) {
            // Ищем слой Holder
            var holderLayer = null;
            for (var i = 1; i <= videoComp.numLayers; i++) {
                if (videoComp.layer(i).name === "Holder") {
                    holderLayer = videoComp.layer(i);
                    break;
                }
            }
            
            // Добавляем все видео в композицию
            for (var i = 0; i < importedFiles.length; i++) {
                var newLayer = videoComp.layers.add(importedFiles[i]);
                
                // Переименовываем слой в VIDEO
                newLayer.name = "VIDEO";
                
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
}



/*
btnOut.onClick = function() {
    safeExecute("renderOut", function() {
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
        
        // Получаем все папки и находим следующий номер
        var folders = previewsFolder.getFiles();
        var numberedFolders = [];
        
        for (var i = 0; i < folders.length; i++) {
            var folder = folders[i];
            if (folder instanceof Folder) {
                var folderName = folder.name;
                // Проверяем, что имя папки состоит только из цифр
                if (/^\d+$/.test(folderName)) {
                    numberedFolders.push(parseInt(folderName));
                }
            }
        }
        
        // Находим следующий номер
        var nextNumber = 1;
        if (numberedFolders.length > 0) {
            numberedFolders.sort(function(a, b) { return a - b; });
            nextNumber = numberedFolders[numberedFolders.length - 1] + 1;
        }
        
        // Создаем новую папку
        var newFolderPath = previewsPath + "/" + nextNumber;
        var newFolder = new Folder(newFolderPath);
        newFolder.create();
        log("Создана папка для рендера: " + newFolderPath, "SUCCESS");
        
        var renderQueue = app.project.renderQueue;
        var addedItems = 0;
        
        // Ищем композицию "MeteoCalendarOut"
        var meteoOutComp = null;
        for (var i = 1; i <= app.project.numItems; i++) {
            if (app.project.item(i).name === "MeteoCalendarOut" && app.project.item(i) instanceof CompItem) {
                meteoOutComp = app.project.item(i);
                break;
            }
        }
        
        // Ищем композицию "MeteoCalendar Instagram"
        var instagramComp = null;
        for (var i = 1; i <= app.project.numItems; i++) {
            if (app.project.item(i).name === "MeteoCalendar Instagram" && app.project.item(i) instanceof CompItem) {
                instagramComp = app.project.item(i);
                break;
            }
        }
        
        // Добавляем MeteoCalendarOut в очередь рендера с первым шаблоном
        if (meteoOutComp != null) {
            var renderItem1 = renderQueue.items.add(meteoOutComp);
            renderItem1.outputModule(1).applyTemplate(RenderTemplate1);
            renderItem1.outputModule(1).audioEnabled = false;
            // Устанавливаем путь для сохранения в созданную папку
            var outputFile1 = new File(newFolderPath + "/MeteoCalendarOut.mp4");
            renderItem1.outputModule(1).file = outputFile1;
            addedItems++;
            log("Добавлена в очередь рендера: MeteoCalendarOut (" + RenderTemplate1 + ") -> " + outputFile1.fsName, "SUCCESS");
        } else {
            log("Композиция 'MeteoCalendarOut' не найдена", "WARNING");
        }
        
        // Добавляем MeteoCalendar Instagram в очередь рендера со вторым шаблоном
        if (instagramComp != null) {
            var renderItem2 = renderQueue.items.add(instagramComp);
            renderItem2.outputModule(1).applyTemplate(RenderTemplate2);
            renderItem2.outputModule(1).audioEnabled = false;
            // Устанавливаем путь для сохранения в созданную папку
            var outputFile2 = new File(newFolderPath + "/MeteoCalendar Instagram_[#####].jpg");
            renderItem2.outputModule(1).file = outputFile2;
            addedItems++;
            log("Добавлена в очередь рендера: MeteoCalendar Instagram (" + RenderTemplate2 + ") -> " + outputFile2.fsName, "SUCCESS");
        } else {
            log("Композиция 'MeteoCalendar Instagram' не найдена", "WARNING");
        }
        
        if (addedItems > 0) {
            // Создаем относительный путь для отображения
            var relativeRenderPath = VideoOutputPath + "/" + nextNumber;
            alert("Добавлено в очередь рендера: " + addedItems + " композиций\nПапка для рендера: " + relativeRenderPath);
            log("Всего добавлено в очередь рендера: " + addedItems + " композиций в папку " + previewsPath + "/" + nextNumber, "SUCCESS");
        } else {
            alert("Не найдено ни одной из композиций для рендера!");
            log("Не найдено композиций для рендера", "ERROR");
        }
        
        return true;
    }, []);
}
*/





btnOut.onClick = function() {
    safeExecute("renderOut", function() {
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
        
        // Получаем все папки и находим следующий номер
        var folders = previewsFolder.getFiles();
        var numberedFolders = [];
        
        for (var i = 0; i < folders.length; i++) {
            var folder = folders[i];
            if (folder instanceof Folder) {
                var folderName = folder.name;
                if (/^\d+$/.test(folderName)) {
                    numberedFolders.push(parseInt(folderName));
                }
            }
        }
        
        // Находим следующий номер
        var nextNumber = 1;
        if (numberedFolders.length > 0) {
            numberedFolders.sort(function(a, b) { return a - b; });
            nextNumber = numberedFolders[numberedFolders.length - 1] + 1;
        }
        
        // Создаем новую папку
        var newFolderPath = previewsPath + "/" + nextNumber;
        var newFolder = new Folder(newFolderPath);
        newFolder.create();
        log("Создана папка для рендера: " + newFolderPath, "SUCCESS");
        
        var renderQueue = app.project.renderQueue;
        var addedItems = 0;
        
        // Ищем композиции
        var meteoOutComp = findCompByName("MeteoCalendarOut");
        var instagramComp = findCompByName("MeteoCalendar Instagram");
        
        // Добавляем MeteoCalendarOut в очередь рендера
        if (meteoOutComp != null) {
            var renderItem1 = renderQueue.items.add(meteoOutComp);
            
            try {
                renderItem1.outputModule(1).applyTemplate(RenderTemplate1);
                log("Применен шаблон: " + RenderTemplate1, "SUCCESS");
            } catch (e) {
                log("Шаблон " + RenderTemplate1 + " не найден, используем базовые настройки", "WARNING");
                // Просто применяем любой доступный видео шаблон
                try {
                    renderItem1.outputModule(1).applyTemplate("H.264");
                } catch (e2) {
                    // Игнорируем ошибку - пусть пользователь настроит вручную
                }
            }
            
            renderItem1.outputModule(1).audioEnabled = false;
            var outputFile1 = new File(newFolderPath + "/MeteoCalendarOut.mp4");
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
            try {
                outputModule.applyTemplate(RenderTemplate2);
                log("Применен шаблон: " + RenderTemplate2, "SUCCESS");
            } catch (e) {
                log("Шаблон " + RenderTemplate2 + " не найден, но это не критично", "INFO");
            }
            
            outputModule.audioEnabled = false;
            
            // КЛЮЧЕВОЙ МОМЕНТ: добавляем [#####] к имени файла для автоматической нумерации
            var outputFile2 = new File(newFolderPath + "/MeteoCalendar_Instagram_[#####].jpg");
            outputModule.file = outputFile2;
            
            addedItems++;
            log("Добавлена в очередь рендера: MeteoCalendar Instagram -> " + outputFile2.fsName, "SUCCESS");
            
        } else {
            log("Композиция 'MeteoCalendar Instagram' не найдена", "WARNING");
        }
        
        if (addedItems > 0) {
            var relativeRenderPath = VideoOutputPath + "/" + nextNumber;
            alert("Добавлено в очередь рендера: " + addedItems + " композиций\nПапка: " + relativeRenderPath + 
                  "\n\nДля Instagram будет создана JPEG секвенция с нумерацией кадров");
            log("Всего добавлено в очередь рендера: " + addedItems + " композиций", "SUCCESS");
        } else {
            alert("Не найдено композиций для рендера!");
            log("Не найдено композиций для рендера", "ERROR");
        }
        
        return true;
    }, []);
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
        RepeTile.property("CC RepeTile-0001").setValue(1500);
        RepeTile.property("CC RepeTile-0002").setValue(1500);
        RepeTile.property("CC RepeTile-0003").setValue(1500);
        RepeTile.property("CC RepeTile-0004").setValue(1500);
        RepeTile.property("CC RepeTile-0005").setValue(4);

        var blurEffect = layer.Effects.addProperty("ADBE Gaussian Blur 2");
        var blur = blurEffect.property("Blurriness");
        blur.expression = "linear(time, inPoint, inPoint+(outPoint-inPoint)/5, 100, 0)"

        var ScaleControl = layer.Effects.addProperty("ADBE Slider Control");
        ScaleControl.property("ADBE Slider Control-0001").setValue(2);
        ScaleControl.name = "ScaleMult";

        var InitScaleControl = layer.Effects.addProperty("ADBE Slider Control");
        InitScaleControl.property("ADBE Slider Control-0001").setValue(0.75);
        InitScaleControl.name = "InitialScaleMult";

        layer.outPoint = layer.inPoint + TimeLength + comp.frameDuration;
        
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
        layer.property("Rotation").expression = "wiggle(0.25,5)";
        
        log("Применено масштабирование к слою: " + layer.name, "INFO");
        return true;
    }, []);
}

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

// === PATCH 7: ИНИЦИАЛИЗАЦИЯ ЛОГИРОВАНИЯ ПРИ ЗАПУСКЕ ===
log("=== СКРИПТ METEO CALENDAR ЗАПУЩЕН ===", "SYSTEM");
log("After Effects версия: " + app.version, "SYSTEM");
log("Путь к изображениям: " + folderPath, "SYSTEM");
log("Путь к бэкапу: " + backupFolderPath, "SYSTEM");
log("Путь к видео: " + VideoInputPath, "SYSTEM");
log("Путь для рендера: " + VideoOutputPath, "SYSTEM");
log("Шаблон рендера 1: " + RenderTemplate1, "SYSTEM");
log("Шаблон рендера 2: " + RenderTemplate2, "SYSTEM");

win.show();

log("Интерфейс скрипта отображен", "SYSTEM");