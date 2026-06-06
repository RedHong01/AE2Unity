/* ae2unityshader exporter
 * After Effects 2026 ExtendScript panel.
 *
 * Install options:
 * - Run with File > Scripts > Run Script File...
 * - Or copy into the After Effects ScriptUI Panels folder to dock it.
 */

(function ae2UnityShaderExporter(thisObj) {
    var SCRIPT_NAME = "ae2unityshader";
    var SCHEMA_VERSION = "0.1.0";
    var SETTINGS_SECTION = "ae2unityshader";
    var LEGACY_SETTINGS_SECTIONS = ["DuoCurtainAE2UnityShader"];
    var DEFAULT_UNITY_EXPORT_RELATIVE_PATH = "Assets/ae2unityshader/Exports";
    var DEFAULT_MEDIA_EXPORT_RELATIVE_PATH = "Assets/ae2unityshader/Media";
    var BRIDGE_FOLDER_NAME = ".ae2unitybridge";
    var UI_LABEL_WIDTH = 136;
    var UI_BUTTON_WIDTH = 104;
    var UI_SMALL_WIDTH = 96;
    var UI_MEDIUM_WIDTH = 190;
    var UI_FIELD_WIDTH = 480;
    var UI_PANEL_MIN_WIDTH = 300;
    var UI_PANEL_MIN_HEIGHT = 360;
    var UI_COMPACT_BREAKPOINT = 620;
    var UI_COMPACT_HORIZONTAL_MARGIN = 48;

    function buildPanel(owner) {
        var panel = owner instanceof Panel
            ? owner
            : new Window("palette", SCRIPT_NAME, undefined, { resizeable: true });

        panel.orientation = "column";
        panel.alignChildren = ["fill", "top"];
        panel.spacing = 10;
        panel.margins = [16, 14, 16, 14];
        panel.minimumSize = [UI_PANEL_MIN_WIDTH, UI_PANEL_MIN_HEIGHT];
        panel.preferredSize = [820, 500];

        var title = panel.add("statictext", undefined, "Export compositions directly into a Unity project");
        title.alignment = ["fill", "top"];
        title.preferredSize.height = 26;
        compactHide(title);
        setHelpTip(title, "Export AE composition data, media, or both into a selected Unity project.");

        var projectGroup = createFormRow(panel, "Unity Project", "Select the Unity project that will receive exported assets.");
        var projectDropdown = projectGroup.add("dropdownlist", undefined, []);
        stretchControl(projectDropdown, 320, 220);
        setHelpTip(projectDropdown, "Choose a Unity Hub project to export into.");
        var refreshProjectsButton = projectGroup.add("button", undefined, "Refresh");
        fixedControl(refreshProjectsButton, UI_BUTTON_WIDTH);
        compactHide(refreshProjectsButton);
        setHelpTip(refreshProjectsButton, "Reload the project list from Unity Hub.");
        var chooseProjectButton = projectGroup.add("button", undefined, "Choose");
        fixedControl(chooseProjectButton, UI_BUTTON_WIDTH);
        compactHide(chooseProjectButton);
        setHelpTip(chooseProjectButton, "Manually choose a Unity project folder.");

        var pathGroup = createFormRow(panel, "Path", "Absolute folder path for the selected Unity project.");
        compactHide(pathGroup);
        var projectPathText = pathGroup.add("edittext", undefined, loadSetting("UnityProjectPath", ""));
        stretchControl(projectPathText, UI_FIELD_WIDTH, 260);
        setHelpTip(projectPathText, "Absolute path to the Unity project root.");

        var exportPathGroup = createFormRow(panel, ".ae2shader Folder", "Unity Assets-relative folder for .ae2shader exports.");
        compactHide(exportPathGroup);
        var relativePathText = exportPathGroup.add("edittext", undefined, loadSetting("UnityExportRelativePath", DEFAULT_UNITY_EXPORT_RELATIVE_PATH));
        stretchControl(relativePathText, UI_FIELD_WIDTH, 260);
        setHelpTip(relativePathText, "Assets-relative folder where Unity imports .ae2shader files.");

        var compGroup = createFormRow(panel, "Composition", "Choose the AE composition source for this export.");
        var compSourceDropdown = compGroup.add("dropdownlist", undefined, ["Current Active Comp", "Specific Comp"]);
        fixedControl(compSourceDropdown, UI_MEDIUM_WIDTH);
        setHelpTip(compSourceDropdown, "Use the active comp or choose a specific comp from the project.");
        compSourceDropdown.selection = loadSetting("CompositionSource", "active") === "specific" ? 1 : 0;
        var compDropdown = compGroup.add("dropdownlist", undefined, []);
        stretchControl(compDropdown, 300, 220);
        setHelpTip(compDropdown, "Select the specific composition to export.");
        var refreshCompsButton = compGroup.add("button", undefined, "Refresh");
        fixedControl(refreshCompsButton, UI_BUTTON_WIDTH);
        compactHide(refreshCompsButton);
        setHelpTip(refreshCompsButton, "Reload compositions from the current AE project.");

        var modeGroup = createFormRow(panel, "Export Mode", "Choose which AE-to-Unity workflow to run.");
        var exportModeDropdown = modeGroup.add("dropdownlist", undefined, [
            "AEBridge: .ae2shader -> Unity shader/material",
            "AEBridge + Media Encoder video",
            "Media Encoder video only",
            "Direct .ae2shader into Unity Assets",
            "Manual folder .ae2shader export"
        ]);
        stretchControl(exportModeDropdown, UI_FIELD_WIDTH, 320);
        setHelpTip(exportModeDropdown, "Send metadata to Unity, render media, or save files manually.");
        exportModeDropdown.selection = getExportModeSelection(loadSetting("ExportMode", "bridge"));

        var mediaFolderGroup = createFormRow(panel, "Media Folder", "Unity Assets-relative folder for rendered media.");
        compactHide(mediaFolderGroup);
        var mediaPathText = mediaFolderGroup.add("edittext", undefined, loadSetting("MediaExportRelativePath", DEFAULT_MEDIA_EXPORT_RELATIVE_PATH));
        stretchControl(mediaPathText, UI_FIELD_WIDTH, 260);
        setHelpTip(mediaPathText, "Assets-relative folder where AME-rendered media will be saved.");

        var mediaOptionsGroup = createFormRow(panel, "Media", "Media Encoder output format and template controls.");
        compactHide(mediaOptionsGroup);
        var mediaExtensionDropdown = mediaOptionsGroup.add("dropdownlist", undefined, ["mp4", "mov", "webm"]);
        fixedControl(mediaExtensionDropdown, UI_SMALL_WIDTH);
        setHelpTip(mediaExtensionDropdown, "Choose the output file extension for the rendered media.");
        mediaExtensionDropdown.selection = getDropdownSelectionByText(mediaExtensionDropdown, loadSetting("MediaExtension", "mp4"));
        var outputTemplateDropdown = mediaOptionsGroup.add("dropdownlist", undefined, []);
        stretchControl(outputTemplateDropdown, 260, 190);
        setHelpTip(outputTemplateDropdown, "Choose the AE Output Module template used before queueing in AME.");
        var refreshTemplatesButton = mediaOptionsGroup.add("button", undefined, "Templates");
        fixedControl(refreshTemplatesButton, UI_BUTTON_WIDTH);
        setHelpTip(refreshTemplatesButton, "Reload Output Module templates for the selected comp.");
        var startAmeCheckbox = mediaOptionsGroup.add("checkbox", undefined, "Start AME");
        fixedControl(startAmeCheckbox, 110);
        setHelpTip(startAmeCheckbox, "Start Adobe Media Encoder after adding the render queue item.");
        startAmeCheckbox.value = loadSetting("StartMediaEncoder", "true") !== "false";

        var optionsGroup = createFormRow(panel, "", "Optional export behaviors.");
        compactHide(optionsGroup);
        var referenceFramesCheckbox = optionsGroup.add("checkbox", undefined, "Reference frames");
        fixedControl(referenceFramesCheckbox, 170);
        setHelpTip(referenceFramesCheckbox, "Export PNG reference frames for visual comparison in Unity.");
        referenceFramesCheckbox.value = loadSetting("ExportReferenceFrames", "true") !== "false";
        var generateShaderCheckbox = optionsGroup.add("checkbox", undefined, "Generate");
        fixedControl(generateShaderCheckbox, 120);
        setHelpTip(generateShaderCheckbox, "Ask Unity to generate shader and material after import.");
        generateShaderCheckbox.value = loadSetting("GenerateShaderAndMaterial", "true") !== "false";

        var runExportButton = panel.add("button", undefined, "Run Export");
        runExportButton.alignment = ["fill", "top"];
        runExportButton.preferredSize.height = 34;
        setHelpTip(runExportButton, "Run the selected export workflow.");
        var checkResultButton = panel.add("button", undefined, "Check Last Bridge Result");
        checkResultButton.alignment = ["fill", "top"];
        checkResultButton.preferredSize.height = 34;
        setHelpTip(checkResultButton, "Read the latest Unity AEBridge result file.");
        var status = panel.add("statictext", undefined, "Ready");
        status.alignment = ["fill", "top"];
        status.preferredSize.height = 48;
        setHelpTip(status, "Shows export progress, warnings, and bridge results.");

        refreshProjectDropdown(projectDropdown, projectPathText, status);
        refreshCompositionDropdown(compDropdown, status);
        refreshOutputTemplateDropdown(outputTemplateDropdown, compSourceDropdown, compDropdown, status);
        updateMediaControls(exportModeDropdown, mediaFolderGroup, mediaOptionsGroup);

        projectDropdown.onChange = function () {
            if (!projectDropdown.selection || !projectDropdown.selection.projectPath) {
                return;
            }

            projectPathText.text = projectDropdown.selection.projectPath;
            saveSetting("UnityProjectPath", projectPathText.text);
            status.text = "Unity project set: " + projectDropdown.selection.text;
        };

        refreshProjectsButton.onClick = function () {
            refreshProjectDropdown(projectDropdown, projectPathText, status);
        };

        chooseProjectButton.onClick = function () {
            var folder = Folder.selectDialog("Choose the Unity project folder that contains Assets and ProjectSettings");
            if (!folder) {
                return;
            }

            if (!isUnityProjectFolder(folder)) {
                alert("This does not look like a Unity project. Choose the folder that contains Assets and ProjectSettings.");
                return;
            }

            projectPathText.text = folder.fsName;
            saveSetting("UnityProjectPath", folder.fsName);
            refreshProjectDropdown(projectDropdown, projectPathText, status);
            status.text = "Unity project set: " + folder.fsName;
        };

        projectPathText.onChange = function () {
            saveSetting("UnityProjectPath", projectPathText.text);
        };

        relativePathText.onChange = function () {
            saveSetting("UnityExportRelativePath", normalizeRelativePath(relativePathText.text));
        };

        compSourceDropdown.onChange = function () {
            saveSetting("CompositionSource", compSourceDropdown.selection && compSourceDropdown.selection.index === 1 ? "specific" : "active");
            refreshOutputTemplateDropdown(outputTemplateDropdown, compSourceDropdown, compDropdown, status);
        };

        compDropdown.onChange = function () {
            if (compDropdown.selection && compDropdown.selection.projectItemIndex) {
                saveSetting("SpecificCompIndex", String(compDropdown.selection.projectItemIndex));
            }

            refreshOutputTemplateDropdown(outputTemplateDropdown, compSourceDropdown, compDropdown, status);
        };

        refreshCompsButton.onClick = function () {
            refreshCompositionDropdown(compDropdown, status);
            refreshOutputTemplateDropdown(outputTemplateDropdown, compSourceDropdown, compDropdown, status);
        };

        exportModeDropdown.onChange = function () {
            saveSetting("ExportMode", getExportModeValue(exportModeDropdown));
            updateMediaControls(exportModeDropdown, mediaFolderGroup, mediaOptionsGroup);
            relayoutPanel(panel);
        };

        mediaPathText.onChange = function () {
            saveSetting("MediaExportRelativePath", normalizeRelativePath(mediaPathText.text || DEFAULT_MEDIA_EXPORT_RELATIVE_PATH));
        };

        mediaExtensionDropdown.onChange = function () {
            if (mediaExtensionDropdown.selection) {
                saveSetting("MediaExtension", mediaExtensionDropdown.selection.text);
            }
        };

        outputTemplateDropdown.onChange = function () {
            if (outputTemplateDropdown.selection) {
                saveSetting("MediaOutputModuleTemplate", outputTemplateDropdown.selection.text);
            }
        };

        refreshTemplatesButton.onClick = function () {
            refreshOutputTemplateDropdown(outputTemplateDropdown, compSourceDropdown, compDropdown, status);
        };

        startAmeCheckbox.onClick = function () {
            saveSetting("StartMediaEncoder", startAmeCheckbox.value ? "true" : "false");
        };

        referenceFramesCheckbox.onClick = function () {
            saveSetting("ExportReferenceFrames", referenceFramesCheckbox.value ? "true" : "false");
        };

        generateShaderCheckbox.onClick = function () {
            saveSetting("GenerateShaderAndMaterial", generateShaderCheckbox.value ? "true" : "false");
        };

        runExportButton.onClick = function () {
            try {
                status.text = runConfiguredExport({
                    comp: getSelectedComposition(compSourceDropdown, compDropdown),
                    exportMode: getExportModeValue(exportModeDropdown),
                    projectPath: projectPathText.text,
                    unityExportPath: relativePathText.text,
                    mediaExportPath: mediaPathText.text,
                    mediaExtension: mediaExtensionDropdown.selection ? mediaExtensionDropdown.selection.text : "mp4",
                    outputModuleTemplate: outputTemplateDropdown.selection ? outputTemplateDropdown.selection.text : "",
                    startMediaEncoder: startAmeCheckbox.value,
                    exportReferenceFrames: referenceFramesCheckbox.value,
                    generateShaderAndMaterial: generateShaderCheckbox.value
                });
            } catch (error) {
                status.text = "Export failed: " + error.toString();
                alert(status.text);
            }
        };

        checkResultButton.onClick = function () {
            try {
                status.text = readLastBridgeResult(projectPathText.text);
            } catch (error) {
                status.text = "Result check failed: " + error.toString();
                alert(status.text);
            }
        };

        panel.onResizing = panel.onResize = function () {
            relayoutPanel(this);
        };
        panel.onShow = function () {
            relayoutPanel(panel);
        };

        relayoutPanel(panel);
        return panel;
    }

    function createFormRow(parent, labelText, helpTip) {
        var row = parent.add("group");
        row.orientation = "row";
        row.alignChildren = ["left", "center"];
        row.alignment = ["fill", "top"];
        row.spacing = 10;
        row.margins = 0;
        row.ae2unityIsFormRow = true;
        setHelpTip(row, helpTip);

        var label = row.add("statictext", undefined, labelText);
        label.alignment = ["left", "center"];
        label.preferredSize.width = UI_LABEL_WIDTH;
        label.minimumSize.width = UI_LABEL_WIDTH;
        label.ae2unityIsFormLabel = true;
        label.ae2unityLabelText = labelText;
        setHelpTip(label, helpTip);
        return row;
    }

    function setHelpTip(control, text) {
        if (!control || !text) {
            return;
        }

        try {
            control.helpTip = text;
        } catch (ignoredHelpTipError) {
        }
    }

    function compactHide(control) {
        if (control) {
            control.ae2unityHideInCompact = true;
        }
        return control;
    }

    function fixedControl(control, width, height) {
        control.alignment = ["left", "center"];
        control.preferredSize.width = width;
        control.minimumSize.width = width;
        control.ae2unityLayoutKind = "fixed";
        control.ae2unityPreferredWidth = width;
        control.ae2unityMinimumWidth = width;
        if (height) {
            control.preferredSize.height = height;
            control.minimumSize.height = height;
        }
        return control;
    }

    function stretchControl(control, preferredWidth, minimumWidth) {
        control.alignment = ["fill", "center"];
        control.preferredSize.width = preferredWidth;
        control.minimumSize.width = minimumWidth || 160;
        control.ae2unityLayoutKind = "stretch";
        control.ae2unityPreferredWidth = preferredWidth;
        control.ae2unityMinimumWidth = minimumWidth || 160;
        return control;
    }

    function relayoutPanel(panel) {
        try {
            applyResponsiveLayout(panel);
            panel.layout.layout(true);
            panel.layout.resize();
        } catch (ignoredLayoutError) {
        }
    }

    function applyResponsiveLayout(panel) {
        var width = getPanelWidth(panel);
        var compact = width > 0 && width < UI_COMPACT_BREAKPOINT;
        var compactWidth = Math.max(160, width - UI_COMPACT_HORIZONTAL_MARGIN);

        walkControls(panel, function (control) {
            if (control.ae2unityHideInCompact) {
                control.visible = !compact;
            }

            if (control.ae2unityIsFormRow) {
                control.orientation = compact ? "column" : "row";
                control.alignChildren = compact ? ["fill", "top"] : ["left", "center"];
                control.spacing = compact ? 4 : 10;
            }

            if (control.ae2unityIsFormLabel) {
                var hasText = control.ae2unityLabelText !== "";
                control.visible = hasText || !compact;
                control.alignment = compact ? ["fill", "top"] : ["left", "center"];
                control.minimumSize.width = compact ? 80 : UI_LABEL_WIDTH;
                control.preferredSize.width = compact ? compactWidth : UI_LABEL_WIDTH;
            }

            if (control.ae2unityLayoutKind) {
                if (compact) {
                    control.alignment = ["fill", "center"];
                    control.minimumSize.width = 80;
                    control.preferredSize.width = compactWidth;
                } else if (control.ae2unityLayoutKind === "fixed") {
                    control.alignment = ["left", "center"];
                    control.minimumSize.width = control.ae2unityMinimumWidth;
                    control.preferredSize.width = control.ae2unityPreferredWidth;
                } else {
                    control.alignment = ["fill", "center"];
                    control.minimumSize.width = control.ae2unityMinimumWidth;
                    control.preferredSize.width = control.ae2unityPreferredWidth;
                }
            }
        });
    }

    function getPanelWidth(panel) {
        try {
            if (panel.size && panel.size.length > 0 && panel.size[0] > 0) {
                return panel.size[0];
            }
        } catch (ignoredSize) {
        }

        try {
            if (panel.bounds) {
                return panel.bounds[2] - panel.bounds[0];
            }
        } catch (ignoredBounds) {
        }

        return 820;
    }

    function walkControls(control, callback) {
        callback(control);
        if (!control.children) {
            return;
        }

        for (var i = 0; i < control.children.length; i++) {
            walkControls(control.children[i], callback);
        }
    }

    function runConfiguredExport(config) {
        var messages = [];
        var mode = config.exportMode || "bridge";

        if (mode === "bridge" || mode === "bridgeMedia") {
            var bridgeResult = sendActiveCompToUnityBridge(
                config.projectPath,
                config.unityExportPath,
                {
                    comp: config.comp,
                    exportReferenceFrames: config.exportReferenceFrames,
                    generateShaderAndMaterial: config.generateShaderAndMaterial
                });
            messages.push("Bridge job sent: " + bridgeResult.jobId);
        }

        if (mode === "media" || mode === "bridgeMedia") {
            var mediaResult = queueMediaEncoderExport(
                config.comp,
                config.projectPath,
                config.mediaExportPath,
                {
                    extension: config.mediaExtension,
                    outputModuleTemplate: config.outputModuleTemplate,
                    startMediaEncoder: config.startMediaEncoder
                });
            messages.push("Media queued: " + mediaResult.fsName);
        }

        if (mode === "direct") {
            var directResult = exportActiveCompToUnityProject(
                config.projectPath,
                config.unityExportPath,
                {
                    comp: config.comp,
                    exportReferenceFrames: config.exportReferenceFrames
                });
            messages.push("Exported: " + directResult.fsName);
        }

        if (mode === "folder") {
            var folderResult = exportActiveCompToChosenFolder({
                comp: config.comp,
                exportReferenceFrames: config.exportReferenceFrames
            });
            messages.push("Exported: " + folderResult.fsName);
        }

        return messages.join(" | ");
    }

    function getExportModeSelection(value) {
        if (value === "bridgeMedia") {
            return 1;
        }
        if (value === "media") {
            return 2;
        }
        if (value === "direct") {
            return 3;
        }
        if (value === "folder") {
            return 4;
        }

        return 0;
    }

    function getExportModeValue(dropdown) {
        if (!dropdown.selection) {
            return "bridge";
        }

        switch (dropdown.selection.index) {
            case 1:
                return "bridgeMedia";
            case 2:
                return "media";
            case 3:
                return "direct";
            case 4:
                return "folder";
            default:
                return "bridge";
        }
    }

    function updateMediaControls(exportModeDropdown, mediaFolderGroup, mediaOptionsGroup) {
        var mode = getExportModeValue(exportModeDropdown);
        var enabled = mode === "media" || mode === "bridgeMedia";
        mediaFolderGroup.enabled = enabled;
        mediaOptionsGroup.enabled = enabled;
    }

    function getDropdownSelectionByText(dropdown, text) {
        for (var i = 0; i < dropdown.items.length; i++) {
            if (dropdown.items[i].text === text) {
                return dropdown.items[i];
            }
        }

        return dropdown.items.length > 0 ? dropdown.items[0] : null;
    }

    function refreshCompositionDropdown(dropdown, status) {
        var savedIndex = Number(loadSetting("SpecificCompIndex", "0"));
        var comps = loadCompositions();
        while (dropdown.items.length > 0) {
            dropdown.remove(dropdown.items[0]);
        }

        if (comps.length === 0) {
            var emptyItem = dropdown.add("item", "No compositions found");
            emptyItem.projectItemIndex = 0;
            dropdown.selection = emptyItem;
            status.text = "No compositions found in current AE project.";
            return;
        }

        var selectedIndex = 0;
        for (var i = 0; i < comps.length; i++) {
            var label = comps[i].name + "  (" + comps[i].width + "x" + comps[i].height + ", " + formatNumber(comps[i].duration) + "s)";
            var item = dropdown.add("item", label);
            item.projectItemIndex = comps[i].projectItemIndex;
            if (comps[i].projectItemIndex === savedIndex) {
                selectedIndex = i;
            }
        }

        dropdown.selection = dropdown.items[selectedIndex];
    }

    function loadCompositions() {
        var comps = [];
        if (!app.project) {
            return comps;
        }

        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem) {
                comps.push({
                    projectItemIndex: i,
                    name: item.name,
                    width: item.width,
                    height: item.height,
                    duration: item.duration
                });
            }
        }

        return comps;
    }

    function refreshOutputTemplateDropdown(dropdown, compSourceDropdown, compDropdown, status) {
        var savedTemplate = loadSetting("MediaOutputModuleTemplate", "");
        var templates = [];
        try {
            templates = getOutputModuleTemplates(getSelectedComposition(compSourceDropdown, compDropdown));
        } catch (ignoredTemplateLoad) {
            templates = [];
        }

        while (dropdown.items.length > 0) {
            dropdown.remove(dropdown.items[0]);
        }

        if (templates.length === 0) {
            templates = ["Lossless"];
        }

        var selectedIndex = 0;
        for (var i = 0; i < templates.length; i++) {
            var item = dropdown.add("item", templates[i]);
            if (templates[i] === savedTemplate) {
                selectedIndex = i;
            }
        }

        dropdown.selection = dropdown.items[selectedIndex];
        if (dropdown.selection) {
            saveSetting("MediaOutputModuleTemplate", dropdown.selection.text);
        }
    }

    function getOutputModuleTemplates(comp) {
        var templates = [];
        var rqItem = null;
        app.beginUndoGroup("AE2Unity Read Output Templates");
        try {
            rqItem = app.project.renderQueue.items.add(comp);
            var outputModule = rqItem.outputModule(1);
            for (var i = 0; i < outputModule.templates.length; i++) {
                templates.push(outputModule.templates[i]);
            }
            rqItem.remove();
        } finally {
            try {
                if (rqItem) {
                    rqItem.remove();
                }
            } catch (ignoredRemove) {
            }
            app.endUndoGroup();
        }

        return templates;
    }

    function getSelectedComposition(compSourceDropdown, compDropdown) {
        if (!compSourceDropdown.selection || compSourceDropdown.selection.index === 0) {
            return getActiveComp();
        }

        if (!compDropdown.selection || !compDropdown.selection.projectItemIndex) {
            throw new Error("Choose a specific composition.");
        }

        var comp = app.project.item(Number(compDropdown.selection.projectItemIndex));
        if (!(comp instanceof CompItem)) {
            throw new Error("Selected project item is not a composition.");
        }

        return comp;
    }

    function getCompositionFromOptions(options) {
        if (options && options.comp) {
            return options.comp;
        }

        return getActiveComp();
    }

    function formatNumber(value) {
        return Math.round(Number(value) * 100) / 100;
    }

    function refreshProjectDropdown(dropdown, projectPathText, status) {
        var savedPath = projectPathText.text || loadSetting("UnityProjectPath", "");
        var projects = loadUnityHubProjects();
        while (dropdown.items.length > 0) {
            dropdown.remove(dropdown.items[0]);
        }

        if (projects.length === 0) {
            var emptyItem = dropdown.add("item", "No Unity Hub projects found");
            emptyItem.projectPath = "";
            dropdown.selection = emptyItem;
            status.text = "No Unity Hub projects found. Use Choose.";
            return;
        }

        var selectedIndex = -1;
        for (var i = 0; i < projects.length; i++) {
            var label = projects[i].title;
            if (projects[i].version) {
                label += "  [" + projects[i].version + "]";
            }
            if (!projects[i].exists) {
                label += "  (missing)";
            }

            var item = dropdown.add("item", label);
            item.projectPath = projects[i].path;
            item.projectTitle = projects[i].title;
            if (normalizePathForCompare(projects[i].path) === normalizePathForCompare(savedPath)) {
                selectedIndex = i;
            }
        }

        if (selectedIndex < 0) {
            selectedIndex = findCurrentWorkingProjectIndex(projects);
        }

        if (selectedIndex < 0) {
            selectedIndex = 0;
        }

        dropdown.selection = dropdown.items[selectedIndex];
        if (dropdown.selection && dropdown.selection.projectPath) {
            projectPathText.text = dropdown.selection.projectPath;
            saveSetting("UnityProjectPath", projectPathText.text);
        }

        status.text = "Loaded " + projects.length + " Unity Hub projects.";
    }

    function findCurrentWorkingProjectIndex(projects) {
        var guessed = "";
        try {
            guessed = new Folder(".").fsName;
        } catch (ignoredCurrentFolder) {
            guessed = "";
        }

        for (var i = 0; i < projects.length; i++) {
            if (normalizePathForCompare(projects[i].path) === normalizePathForCompare(guessed)) {
                return i;
            }
        }

        return -1;
    }

    function loadUnityHubProjects() {
        var projectsFile = findExistingFile(getUnityHubFileCandidates("projects-v1.json"));
        if (!projectsFile) {
            return [];
        }

        var text = readTextFile(projectsFile);
        var parsed = parseJson(text);
        var data = parsed && parsed.data ? parsed.data : parsed;
        var projects = [];

        for (var key in data) {
            if (!data.hasOwnProperty(key)) {
                continue;
            }

            var source = data[key];
            if (!source) {
                continue;
            }

            var path = source.path || key;
            var title = source.title || source.projectName || baseName(path);
            if (!path || !title) {
                continue;
            }

            projects.push({
                title: title,
                path: path,
                version: source.version || "",
                lastModified: Number(source.lastModified || 0),
                sizeInBytes: Number(source.sizeInBytes || 0),
                isFavorite: source.isFavorite === true,
                exists: isUnityProjectFolder(new Folder(path))
            });
        }

        projects = applyUnityHubSort(projects);
        return projects;
    }

    function applyUnityHubSort(projects) {
        var sortFile = findExistingFile(getUnityHubFileCandidates("projectSortPreferences.json"));
        var sortBy = "lastModified";
        var sortDirection = "descending";

        if (sortFile) {
            try {
                var sort = parseJson(readTextFile(sortFile));
                sortBy = sort.sortBy || sortBy;
                sortDirection = sort.sortDirection || sortDirection;
            } catch (ignoredSort) {
            }
        }

        projects.sort(function (a, b) {
            var direction = sortDirection === "ascending" ? 1 : -1;
            var av = projectSortValue(a, sortBy);
            var bv = projectSortValue(b, sortBy);

            if (typeof av === "number" && typeof bv === "number") {
                if (av === bv) {
                    return compareText(a.title, b.title);
                }
                return av < bv ? -direction : direction;
            }

            return compareText(String(av), String(bv)) * direction;
        });

        return projects;
    }

    function projectSortValue(project, sortBy) {
        if (sortBy === "title" || sortBy === "name" || sortBy === "projectName") {
            return project.title.toLowerCase();
        }
        if (sortBy === "path") {
            return project.path.toLowerCase();
        }
        if (sortBy === "version") {
            return project.version.toLowerCase();
        }
        if (sortBy === "sizeInBytes") {
            return project.sizeInBytes;
        }
        if (sortBy === "isFavorite") {
            return project.isFavorite ? 1 : 0;
        }

        return project.lastModified;
    }

    function compareText(a, b) {
        if (a === b) {
            return 0;
        }

        return a < b ? -1 : 1;
    }

    function getUnityHubFileCandidates(fileName) {
        var candidates = [];
        var home = Folder("~").fsName;
        var appData = safeEnv("APPDATA");
        var localAppData = safeEnv("LOCALAPPDATA");

        candidates.push(home + "/Library/Application Support/UnityHub/" + fileName);
        candidates.push(home + "/Library/Application Support/Unity Hub/" + fileName);

        if (appData) {
            candidates.push(appData + "/UnityHub/" + fileName);
            candidates.push(appData + "/Unity Hub/" + fileName);
        }
        if (localAppData) {
            candidates.push(localAppData + "/UnityHub/" + fileName);
            candidates.push(localAppData + "/Unity Hub/" + fileName);
        }

        return candidates;
    }

    function findExistingFile(paths) {
        for (var i = 0; i < paths.length; i++) {
            var file = new File(paths[i]);
            if (file.exists) {
                return file;
            }
        }

        return null;
    }

    function readTextFile(file) {
        file.encoding = "UTF-8";
        if (!file.open("r")) {
            throw new Error("Could not read file: " + file.fsName);
        }

        var text = file.read();
        file.close();
        return text;
    }

    function parseJson(text) {
        if (typeof JSON !== "undefined" && JSON.parse) {
            return JSON.parse(text);
        }

        return eval("(" + text + ")");
    }

    function safeEnv(name) {
        try {
            return $.getenv(name) || "";
        } catch (ignoredEnv) {
            return "";
        }
    }

    function baseName(path) {
        var parts = String(path).replace(/\\/g, "/").split("/");
        return parts.length > 0 ? parts[parts.length - 1] : String(path);
    }

    function normalizePathForCompare(path) {
        return String(path || "").replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
    }

    function exportActiveCompToChosenFolder(options) {
        var comp = getCompositionFromOptions(options);
        var folder = Folder.selectDialog("Choose export folder for " + comp.name);
        if (!folder) {
            throw new Error("Export cancelled.");
        }

        return exportActiveCompToFolder(comp, folder, options);
    }

    function exportActiveCompToUnityProject(projectPath, relativePath, options) {
        var comp = getCompositionFromOptions(options);
        var projectFolder = new Folder(projectPath);
        if (!isUnityProjectFolder(projectFolder)) {
            throw new Error("Choose a Unity project folder that contains Assets and ProjectSettings.");
        }

        var normalizedRelativePath = normalizeRelativePath(relativePath || DEFAULT_UNITY_EXPORT_RELATIVE_PATH);
        if (!(normalizedRelativePath === "Assets" || normalizedRelativePath.indexOf("Assets/") === 0)) {
            normalizedRelativePath = "Assets/" + normalizedRelativePath;
        }

        saveSetting("UnityProjectPath", projectFolder.fsName);
        saveSetting("UnityExportRelativePath", normalizedRelativePath);

        var exportFolder = new Folder(joinPath(projectFolder.fsName, normalizedRelativePath));
        ensureFolderExists(exportFolder);
        return exportActiveCompToFolder(comp, exportFolder, options);
    }

    function sendActiveCompToUnityBridge(projectPath, relativePath, options) {
        var comp = getCompositionFromOptions(options);
        var projectFolder = new Folder(projectPath);
        if (!isUnityProjectFolder(projectFolder)) {
            throw new Error("Choose a Unity project folder that contains Assets and ProjectSettings.");
        }

        var normalizedRelativePath = normalizeRelativePath(relativePath || DEFAULT_UNITY_EXPORT_RELATIVE_PATH);
        if (!(normalizedRelativePath === "Assets" || normalizedRelativePath.indexOf("Assets/") === 0)) {
            normalizedRelativePath = "Assets/" + normalizedRelativePath;
        }

        saveSetting("UnityProjectPath", projectFolder.fsName);
        saveSetting("UnityExportRelativePath", normalizedRelativePath);

        var bridgeRoot = new Folder(projectFolder.fsName + "/" + BRIDGE_FOLDER_NAME);
        var inboxFolder = new Folder(bridgeRoot.fsName + "/inbox");
        var payloadsFolder = new Folder(bridgeRoot.fsName + "/payloads");
        var outboxFolder = new Folder(bridgeRoot.fsName + "/outbox");
        ensureFolderExists(inboxFolder);
        ensureFolderExists(payloadsFolder);
        ensureFolderExists(outboxFolder);

        var jobId = createJobId(comp);
        var payloadFolder = new Folder(payloadsFolder.fsName + "/" + jobId);
        ensureFolderExists(payloadFolder);

        var payloadFile = exportActiveCompToFolder(comp, payloadFolder, options);
        var job = {
            protocolVersion: "0.1.0",
            jobId: jobId,
            command: "ImportAe2Shader",
            createdAt: new Date().toUTCString(),
            sender: "After Effects 2026",
            compName: comp.name,
            payloadFile: "payloads/" + jobId + "/" + payloadFile.name,
            referenceFramesFolder: options && options.exportReferenceFrames === false ? "" : "payloads/" + jobId + "/reference_frames",
            unityOutputPath: normalizedRelativePath,
            overwriteGeneratedAssets: true,
            generateShaderAndMaterial: !(options && options.generateShaderAndMaterial === false),
            refreshAssetDatabase: true
        };

        var tempJobFile = new File(inboxFolder.fsName + "/" + jobId + ".tmp");
        writeTextFile(tempJobFile, toJson(job));
        if (!tempJobFile.rename(jobId + ".job")) {
            var jobFile = new File(inboxFolder.fsName + "/" + jobId + ".job");
            writeTextFile(jobFile, toJson(job));
            try {
                tempJobFile.remove();
            } catch (ignoredRemove) {
            }
        }

        saveSetting("LastBridgeJobId", jobId);
        return {
            jobId: jobId,
            payloadFile: payloadFile
        };
    }

    function queueMediaEncoderExport(comp, projectPath, mediaRelativePath, options) {
        options = options || {};
        var projectFolder = new Folder(projectPath);
        if (!isUnityProjectFolder(projectFolder)) {
            throw new Error("Choose a Unity project folder that contains Assets and ProjectSettings.");
        }

        var normalizedMediaPath = normalizeRelativePath(mediaRelativePath || DEFAULT_MEDIA_EXPORT_RELATIVE_PATH);
        if (!(normalizedMediaPath === "Assets" || normalizedMediaPath.indexOf("Assets/") === 0)) {
            normalizedMediaPath = "Assets/" + normalizedMediaPath;
        }

        saveSetting("MediaExportRelativePath", normalizedMediaPath);

        var mediaFolder = new Folder(joinPath(projectFolder.fsName, normalizedMediaPath));
        ensureFolderExists(mediaFolder);

        var extension = normalizeExtension(options.extension || "mp4");
        var outputFile = new File(mediaFolder.fsName + "/" + sanitizeFileName(comp.name) + "." + extension);
        var existingItems = collectRenderQueueItems();
        var previousStates = setRenderQueueItemsRender(existingItems, false);
        var rqItem = null;

        app.beginUndoGroup("AE2Unity Queue Media Encoder Export");
        try {
            rqItem = app.project.renderQueue.items.add(comp);
            rqItem.render = true;

            var outputModule = rqItem.outputModule(1);
            if (options.outputModuleTemplate) {
                try {
                    outputModule.applyTemplate(options.outputModuleTemplate);
                } catch (ignoredTemplate) {
                }
            }

            outputModule.file = outputFile;

            if (!app.project.renderQueue.canQueueInAME) {
                throw new Error("After Effects cannot queue the current render item in Adobe Media Encoder.");
            }

            app.project.renderQueue.queueInAME(options.startMediaEncoder !== false);
        } finally {
            restoreRenderQueueItemsRender(previousStates);
            app.endUndoGroup();
        }

        return outputFile;
    }

    function collectRenderQueueItems() {
        var items = [];
        try {
            for (var i = 1; i <= app.project.renderQueue.numItems; i++) {
                items.push(app.project.renderQueue.item(i));
            }
        } catch (ignoredCollect) {
        }

        return items;
    }

    function setRenderQueueItemsRender(items, renderValue) {
        var states = [];
        for (var i = 0; i < items.length; i++) {
            try {
                states.push({
                    item: items[i],
                    render: items[i].render
                });
                items[i].render = renderValue;
            } catch (ignoredState) {
            }
        }

        return states;
    }

    function restoreRenderQueueItemsRender(states) {
        for (var i = 0; i < states.length; i++) {
            try {
                states[i].item.render = states[i].render;
            } catch (ignoredRestore) {
            }
        }
    }

    function readLastBridgeResult(projectPath) {
        var projectFolder = new Folder(projectPath);
        if (!isUnityProjectFolder(projectFolder)) {
            throw new Error("Choose a Unity project folder first.");
        }

        var jobId = loadSetting("LastBridgeJobId", "");
        if (!jobId) {
            return "No bridge job has been sent yet.";
        }

        var resultFile = new File(projectFolder.fsName + "/" + BRIDGE_FOLDER_NAME + "/outbox/" + jobId + ".result.json");
        if (!resultFile.exists) {
            return "Waiting for Unity AEBridge: " + jobId;
        }

        resultFile.encoding = "UTF-8";
        if (!resultFile.open("r")) {
            throw new Error("Could not read bridge result: " + resultFile.fsName);
        }

        var text = resultFile.read();
        resultFile.close();
        return compactResultText(text);
    }

    function getActiveComp() {
        if (!app.project) {
            throw new Error("No active After Effects project.");
        }

        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) {
            throw new Error("Select or open a composition before exporting.");
        }

        return comp;
    }

    function exportActiveCompToFolder(comp, folder, options) {
        options = options || {};
        ensureFolderExists(folder);
        var referenceFolder = new Folder(folder.fsName + "/reference_frames");
        if (options.exportReferenceFrames !== false) {
            ensureFolderExists(referenceFolder);
        }

        var assetMap = {};
        var assets = [];
        var warnings = [];
        var layers = [];

        app.beginUndoGroup(SCRIPT_NAME);
        try {
            for (var i = 1; i <= comp.numLayers; i++) {
                layers.push(collectLayer(comp.layer(i), assetMap, assets, warnings));
            }

            if (options.exportReferenceFrames !== false) {
                saveReferenceFrames(comp, referenceFolder, warnings);
            }
        } finally {
            app.endUndoGroup();
        }

        var document = {
            schemaVersion: SCHEMA_VERSION,
            exporter: "ae2unityshader exporter 0.2.0",
            exportedAt: new Date().toUTCString(),
            comp: collectComp(comp),
            layers: layers,
            assets: assets,
            warnings: warnings
        };

        var outputFile = new File(folder.fsName + "/" + sanitizeFileName(comp.name) + ".ae2shader");
        outputFile.encoding = "UTF-8";
        if (!outputFile.open("w")) {
            throw new Error("Could not write export file: " + outputFile.fsName);
        }

        outputFile.write(toJson(document));
        outputFile.close();
        return outputFile;
    }

    function writeTextFile(file, text) {
        file.encoding = "UTF-8";
        if (!file.open("w")) {
            throw new Error("Could not write file: " + file.fsName);
        }

        file.write(text);
        file.close();
    }

    function isUnityProjectFolder(folder) {
        if (!folder || !folder.exists) {
            return false;
        }

        return new Folder(folder.fsName + "/Assets").exists &&
            new Folder(folder.fsName + "/ProjectSettings").exists;
    }

    function ensureFolderExists(folder) {
        if (folder.exists) {
            return;
        }

        var parent = folder.parent;
        if (parent && !parent.exists) {
            ensureFolderExists(parent);
        }

        if (!folder.exists && !folder.create()) {
            throw new Error("Could not create folder: " + folder.fsName);
        }
    }

    function joinPath(root, relativePath) {
        return String(root).replace(/[\\\/]+$/, "") + "/" + normalizeRelativePath(relativePath);
    }

    function normalizeRelativePath(path) {
        var normalized = String(path || DEFAULT_UNITY_EXPORT_RELATIVE_PATH).replace(/\\/g, "/");
        normalized = normalized.replace(/^\/+/, "").replace(/\/+$/, "");
        return normalized || DEFAULT_UNITY_EXPORT_RELATIVE_PATH;
    }

    function normalizeExtension(extension) {
        var normalized = String(extension || "mp4").replace(/^\./, "").toLowerCase();
        if (!normalized) {
            normalized = "mp4";
        }

        return normalized;
    }

    function loadSetting(key, fallback) {
        try {
            if (app.settings.haveSetting(SETTINGS_SECTION, key)) {
                return app.settings.getSetting(SETTINGS_SECTION, key);
            }
        } catch (ignoredSettingLoad) {
        }

        for (var i = 0; i < LEGACY_SETTINGS_SECTIONS.length; i++) {
            try {
                if (app.settings.haveSetting(LEGACY_SETTINGS_SECTIONS[i], key)) {
                    return app.settings.getSetting(LEGACY_SETTINGS_SECTIONS[i], key);
                }
            } catch (ignoredLegacySettingLoad) {
            }
        }

        return fallback;
    }

    function saveSetting(key, value) {
        try {
            app.settings.saveSetting(SETTINGS_SECTION, key, String(value));
        } catch (ignoredSettingSave) {
        }
    }

    function collectComp(comp) {
        var colorSpace = "unknown";
        var bitDepth = 8;

        try {
            colorSpace = app.project.workingSpace || "none";
        } catch (ignoredColorSpace) {
            colorSpace = "unknown";
        }

        try {
            bitDepth = app.project.bitsPerChannel || 8;
        } catch (ignoredBitDepth) {
            bitDepth = 8;
        }

        return {
            name: comp.name,
            width: comp.width,
            height: comp.height,
            frameRate: comp.frameRate,
            duration: comp.duration,
            workAreaStart: comp.workAreaStart,
            workAreaDuration: comp.workAreaDuration,
            colorSpace: colorSpace,
            bitDepth: bitDepth
        };
    }

    function collectLayer(layer, assetMap, assets, warnings) {
        var sourceAssetId = collectAsset(layer, assetMap, assets);

        return {
            id: "layer-" + layer.index,
            index: layer.index,
            name: layer.name,
            type: getLayerType(layer),
            enabled: layer.enabled,
            threeDLayer: safeBoolean(function () { return layer.threeDLayer; }, false),
            startTime: layer.startTime,
            inPoint: layer.inPoint,
            outPoint: layer.outPoint,
            parentId: layer.parent ? "layer-" + layer.parent.index : "",
            blendMode: enumName(safeValue(function () { return layer.blendingMode; }, "NORMAL")),
            matteMode: enumName(safeValue(function () { return layer.trackMatteType; }, "NO_TRACK_MATTE")),
            sourceAssetId: sourceAssetId,
            transform: collectTransform(layer),
            effects: collectEffects(layer, warnings),
            masks: collectMasks(layer),
            expressions: collectLayerExpressions(layer)
        };
    }

    function collectAsset(layer, assetMap, assets) {
        if (!(layer instanceof AVLayer) || !layer.source) {
            return "";
        }

        var source = layer.source;
        var sourceId = safeValue(function () { return source.id; }, "");
        var id = "asset-" + (sourceId ? sourceId : sanitizeFileName(source.name));
        if (assetMap[id]) {
            return id;
        }

        var path = "";
        try {
            if (source.file) {
                path = source.file.fsName;
            }
        } catch (ignoredFilePath) {
            path = "";
        }

        var type = "unknown";
        if (source instanceof CompItem) {
            type = "precomp";
        } else if (source instanceof FootageItem) {
            type = "footage";
        }

        assetMap[id] = true;
        assets.push({
            id: id,
            name: source.name,
            type: type,
            path: path,
            width: safeNumber(function () { return source.width; }, 0),
            height: safeNumber(function () { return source.height; }, 0),
            frameRate: safeNumber(function () { return source.frameRate; }, 0),
            duration: safeNumber(function () { return source.duration; }, 0)
        });

        return id;
    }

    function collectTransform(layer) {
        var transform = layer.property("ADBE Transform Group");
        return {
            anchorPoint: collectAnimatedVector3(findProperty(transform, "ADBE Anchor Point"), [0, 0, 0]),
            position: collectAnimatedVector3(findProperty(transform, "ADBE Position"), [0, 0, 0]),
            scale: collectAnimatedVector3(findProperty(transform, "ADBE Scale"), [100, 100, 100]),
            rotation: collectAnimatedFloat(findProperty(transform, "ADBE Rotate Z") || findProperty(transform, "ADBE Rotation"), 0),
            opacity: collectAnimatedFloat(findProperty(transform, "ADBE Opacity"), 100)
        };
    }

    function collectAnimatedFloat(property, fallback) {
        var result = {
            value: fallback,
            expression: "",
            keys: []
        };

        if (!property) {
            return result;
        }

        var value = safeValue(function () { return property.value; }, fallback);
        if (value instanceof Array) {
            value = value.length > 0 ? value[0] : fallback;
        }
        result.value = Number(value);
        result.expression = collectExpression(property);

        for (var i = 1; i <= property.numKeys; i++) {
            var keyValue = property.keyValue(i);
            if (keyValue instanceof Array) {
                keyValue = keyValue.length > 0 ? keyValue[0] : fallback;
            }

            result.keys.push({
                time: property.keyTime(i),
                value: Number(keyValue)
            });
        }

        return result;
    }

    function collectAnimatedVector3(property, fallback) {
        var value = property ? safeValue(function () { return property.value; }, fallback) : fallback;
        var result = vector3Object(value, fallback);
        result.expression = property ? collectExpression(property) : "";
        result.keys = [];

        if (!property) {
            return result;
        }

        for (var i = 1; i <= property.numKeys; i++) {
            var keyVector = vector3Object(property.keyValue(i), fallback);
            keyVector.time = property.keyTime(i);
            result.keys.push(keyVector);
        }

        return result;
    }

    function collectExpression(property) {
        try {
            if (property.canSetExpression && property.expressionEnabled && property.expression) {
                return property.expression;
            }
        } catch (ignoredExpression) {
            return "";
        }

        return "";
    }

    function collectLayerExpressions(layer) {
        var expressions = [];
        collectExpressionsRecursive(layer, expressions);
        return expressions;
    }

    function collectExpressionsRecursive(group, expressions) {
        if (!group || !group.numProperties) {
            return;
        }

        for (var i = 1; i <= group.numProperties; i++) {
            var property = group.property(i);
            if (!property) {
                continue;
            }

            var expression = collectExpression(property);
            if (expression) {
                expressions.push(property.matchName + ": " + expression);
            }

            collectExpressionsRecursive(property, expressions);
        }
    }

    function collectEffects(layer, warnings) {
        var effects = [];
        var parade = layer.property("ADBE Effect Parade");
        if (!parade) {
            return effects;
        }

        for (var i = 1; i <= parade.numProperties; i++) {
            var effect = parade.property(i);
            var parameters = [];

            for (var p = 1; p <= effect.numProperties; p++) {
                var param = effect.property(p);
                parameters.push({
                    name: param.name,
                    matchName: param.matchName,
                    valueType: String(param.propertyValueType),
                    value: stringifyPropertyValue(safeValue(function () { return param.value; }, ""))
                });
            }

            effects.push({
                matchName: effect.matchName,
                displayName: effect.name,
                enabled: safeBoolean(function () { return effect.enabled; }, true),
                parameters: parameters
            });

            if (effect.matchName.indexOf("ADBE") !== 0) {
                warnings.push({
                    code: "THIRD_PARTY_EFFECT",
                    message: "Third-party effect should be baked or implemented manually: " + effect.name,
                    layerId: "layer-" + layer.index
                });
            }
        }

        return effects;
    }

    function collectMasks(layer) {
        var masks = [];
        var parade = layer.property("ADBE Mask Parade");
        if (!parade) {
            return masks;
        }

        for (var i = 1; i <= parade.numProperties; i++) {
            var mask = parade.property(i);
            var feather = safeValue(function () {
                return mask.property("ADBE Mask Feather").value;
            }, [0, 0]);

            masks.push({
                name: mask.name,
                mode: enumName(safeValue(function () { return mask.maskMode; }, "ADD")),
                inverted: safeBoolean(function () { return mask.inverted; }, false),
                opacity: safeNumber(function () { return mask.property("ADBE Mask Opacity").value; }, 100),
                expansion: safeNumber(function () { return mask.property("ADBE Mask Expansion").value; }, 0),
                featherX: feather instanceof Array ? Number(feather[0]) : Number(feather),
                featherY: feather instanceof Array && feather.length > 1 ? Number(feather[1]) : 0
            });
        }

        return masks;
    }

    function saveReferenceFrames(comp, folder, warnings) {
        var times = [
            comp.workAreaStart,
            comp.workAreaStart + comp.workAreaDuration * 0.5,
            Math.max(comp.workAreaStart, comp.workAreaStart + comp.workAreaDuration - (1 / comp.frameRate))
        ];

        for (var i = 0; i < times.length; i++) {
            var frameFile = new File(folder.fsName + "/" + sanitizeFileName(comp.name) + "_ref_" + i + ".png");
            try {
                comp.saveFrameToPng(times[i], frameFile);
            } catch (error) {
                warnings.push({
                    code: "REFERENCE_FRAME_FAILED",
                    message: "Could not export reference frame at " + times[i] + "s: " + error.toString(),
                    layerId: ""
                });
            }
        }
    }

    function findProperty(group, matchName) {
        if (!group) {
            return null;
        }

        for (var i = 1; i <= group.numProperties; i++) {
            var property = group.property(i);
            if (property && property.matchName === matchName) {
                return property;
            }
        }

        return null;
    }

    function getLayerType(layer) {
        if (layer instanceof CameraLayer) {
            return "camera";
        }
        if (layer instanceof LightLayer) {
            return "light";
        }
        if (layer instanceof TextLayer) {
            return "text";
        }
        if (layer instanceof ShapeLayer) {
            return "shape";
        }
        if (layer instanceof AVLayer && layer.source instanceof CompItem) {
            return "precomp";
        }
        if (layer instanceof AVLayer && layer.source instanceof FootageItem) {
            return "footage";
        }

        return "unknown";
    }

    function vector3Object(value, fallback) {
        var source = value instanceof Array ? value : fallback;
        return {
            x: Number(source.length > 0 ? source[0] : fallback[0]),
            y: Number(source.length > 1 ? source[1] : fallback[1]),
            z: Number(source.length > 2 ? source[2] : fallback[2])
        };
    }

    function enumName(value) {
        var text = String(value);
        var dot = text.lastIndexOf(".");
        if (dot >= 0) {
            text = text.substring(dot + 1);
        }
        return text;
    }

    function stringifyPropertyValue(value) {
        if (value instanceof Array) {
            var parts = [];
            for (var i = 0; i < value.length; i++) {
                parts.push(String(value[i]));
            }
            return parts.join(",");
        }

        return String(value);
    }

    function sanitizeFileName(value) {
        return String(value).replace(/[\\\/\:\*\?\"\<\>\|]/g, "_");
    }

    function createJobId(comp) {
        var stamp = new Date().getTime();
        var random = Math.floor(Math.random() * 1000000);
        return "ae_" + sanitizeFileName(comp.name).replace(/\s+/g, "_") + "_" + stamp + "_" + random;
    }

    function compactResultText(text) {
        var status = matchJsonString(text, "status") || "Unknown";
        var message = matchJsonString(text, "message") || "";
        var material = matchJsonString(text, "generatedMaterialPath") || "";
        if (material) {
            return status + ": " + message + " -> " + material;
        }

        return status + ": " + message;
    }

    function matchJsonString(text, key) {
        var pattern = new RegExp("\"" + key + "\"\\s*:\\s*\"([^\"]*)\"");
        var match = pattern.exec(text);
        return match ? match[1].replace(/\\n/g, "\n").replace(/\\"/g, "\"") : "";
    }

    function safeValue(callback, fallback) {
        try {
            return callback();
        } catch (ignored) {
            return fallback;
        }
    }

    function safeNumber(callback, fallback) {
        var value = safeValue(callback, fallback);
        value = Number(value);
        return isFinite(value) ? value : fallback;
    }

    function safeBoolean(callback, fallback) {
        var value = safeValue(callback, fallback);
        if (value === true || value === false) {
            return value;
        }
        if (value === "true") {
            return true;
        }
        if (value === "false") {
            return false;
        }
        return fallback;
    }

    function toJson(value) {
        if (value === null || value === undefined) {
            return "null";
        }

        var type = typeof value;
        if (type === "number") {
            return isFinite(value) ? String(value) : "0";
        }
        if (type === "boolean") {
            return value ? "true" : "false";
        }
        if (type === "string") {
            return quoteJson(value);
        }
        if (value instanceof Array) {
            var arrayParts = [];
            for (var i = 0; i < value.length; i++) {
                arrayParts.push(toJson(value[i]));
            }
            return "[" + arrayParts.join(",") + "]";
        }

        var objectParts = [];
        for (var key in value) {
            if (value.hasOwnProperty(key) && typeof value[key] !== "function") {
                objectParts.push(quoteJson(key) + ":" + toJson(value[key]));
            }
        }
        return "{" + objectParts.join(",") + "}";
    }

    function quoteJson(value) {
        return "\"" + String(value)
            .replace(/\\/g, "\\\\")
            .replace(/\"/g, "\\\"")
            .replace(/\r/g, "\\r")
            .replace(/\n/g, "\\n")
            .replace(/\t/g, "\\t") + "\"";
    }

    var panel = buildPanel(thisObj);
    if (panel instanceof Window) {
        panel.center();
        panel.show();
    }
})(this);
