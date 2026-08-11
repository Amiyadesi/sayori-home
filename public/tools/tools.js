(() => {
	"use strict";

	const copy = {
		zh: {
			brand: "Amiya的书桌", back: "回书桌", subaruTap: "Subaru Tap", localBadge: "本地处理", eyebrow: "sayori.org / tools", title: "素材工具台", intro: "把图片变成能直接放进游戏和网页的素材", privacy: "文件不会上传，刷新页面就会清空",
			toolboxLabel: "工具箱", chooseTool: "选择一个工作流", railNote: "适合快速试参数，结果确认后再下载",
			pixelTab: "像素化", pixelTabHint: "做出复古颗粒感", tilesTab: "网格切片", tilesTabHint: "整理规则图集", autotileTab: "自动补全", autotileTabHint: "支持多种输入输出",
			pixelKicker: "01 / pixelizer", pixelTitle: "把图片变成像素画", pixelIntro: "先拖入图片，再拖动参数看结果", tilesKicker: "02 / tile sheet", tilesTitle: "按网格切片", tilesIntro: "用尺寸和偏移控制每一个图块", autotileKicker: "03 / autotile", autotileTitle: "生成自动补全图集", autotileIntro: "支持 Webtyler、Basic、Minitiles 和 RPG Maker 输入，并导出多种图集格式",
			outputReady: "等待素材", previewHeading: "实时预览", previewHint: "原图与结果会同步更新", gridHint: "原图会显示切片边界", autotileHint: "右侧输出可直接用于 Godot",
			upload: "点击或拖入图片", uploadHint: "PNG、JPG、WebP，最大 10 MB，也可直接粘贴", adjustments: "调整", live: "实时", gridSettings: "网格设置", autotileSettings: "输入设置", pixels: "像素",
			pixelStyle: "风格", stylePixel: "像素", stylePoster: "海报", styleNoir: "黑白", styleDuotone: "双色", styleBlueprint: "蓝图", styleSoft: "柔和", pixelSize: "像素块", palette: "颜色数量", paletteOriginal: "保留原色", background: "背景", backgroundTransparent: "透明", backgroundWhite: "白色", backgroundBlack: "黑色", outputScale: "导出倍率", dither: "轻微抖动",
			tileWidth: "图块宽度", tileHeight: "图块高度", tileOffsetX: "水平偏移", tileOffsetY: "垂直偏移", tileMargin: "四周边距", tileGap: "图块间距", autotileFormat: "输入格式", autotileFormat4x4: "Webtyler 4×4", autotileFormat3x3: "Webtyler 3×3", autotileFormat4x4plus: "Webtyler 4×4 Plus", autotileFormat3x3plus: "Webtyler 3×3 Plus", autotileFormat5x3: "Webtyler 5×3", autotileFormat5x2: "Webtyler 5×2", autotileFormat4x2: "Webtyler 4×2", autotileFormatBasic: "Basic", autotileFormatBasicBorder: "Basic Border", autotileFormatBasicFullBorder: "Basic Full Border", autotileFormatBasicLongBorder: "Basic Long Border", autotileFormatMinitiles: "Minitiles", autotileFormatRpgmaker: "RPG Maker", autotileOutput: "输出格式", autotileOutputGodot: "Godot 12×4", autotileOutputRpgmaker: "RPG Maker 2×3", autotileOutputGamemaker: "GameMaker 12×4", autotileOutputPreview: "预览 12×9", autotileSize: "图块尺寸", autotileLeft: "左偏移", autotileRight: "右偏移", autotileTop: "上偏移", autotileBottom: "下偏移",
			autotileSource: "输入图集", autotileResult: "自动补全结果", reset: "清空", download: "下载 PNG", original: "原图", result: "像素化结果", sourceSheet: "原始图集", tileResult: "切片结果", empty: "拖入一张图片开始", services: "公共服务说明", footer: "本地处理 · 无需账号 · 结果由你保存",
			noImage: "先选择一张图片", tooLarge: "图片超过 10 MB", badImage: "图片无法读取", noTiles: "当前偏移和尺寸无法切出完整图块", badAutotile: "当前偏移下没有完整的输入图块", pixelStats: (width, height, pixelSize, palette, style) => `${width} × ${height}px · 像素块 ${pixelSize}${palette ? ` · ${palette} 色` : ""}${style ? ` · ${style}` : ""}`, tileStats: (columns, rows, width, height) => `${columns} × ${rows} 个图块 · 输出 ${width} × ${height}px`, autotileStats: (format, output, width, height) => `${format} → ${output} · 输出 ${width} × ${height}px`, pasteReady: "已从剪贴板读取图片", ready: "已生成，可以下载", downloaded: "已开始下载", cleared: "已清空",
		},
		en: {
			brand: "Amiya's Desk", back: "Back to desk", subaruTap: "Subaru Tap", localBadge: "Runs locally", eyebrow: "sayori.org / tools", title: "Asset workbench", intro: "Turn images into assets you can use in games and on the web", privacy: "Files never leave this device and clear when you refresh",
			toolboxLabel: "Toolbox", chooseTool: "Choose a workflow", railNote: "Try parameters quickly, then download when it looks right",
			pixelTab: "Pixelizer", pixelTabHint: "Make a retro grain", tilesTab: "Grid slicer", tilesTabHint: "Organize a tile sheet", autotileTab: "Auto-tile", autotileTabHint: "Many input and output formats",
			pixelKicker: "01 / pixelizer", pixelTitle: "Turn an image into pixel art", pixelIntro: "Drop in an image, then tune the result live", tilesKicker: "02 / tile sheet", tilesTitle: "Slice a regular grid", tilesIntro: "Use size and offset to control every tile", autotileKicker: "03 / autotile", autotileTitle: "Build an autotile atlas", autotileIntro: "Convert Webtyler, Basic, Minitiles, or RPG Maker inputs into several atlas formats",
			outputReady: "Waiting for an asset", previewHeading: "Live preview", previewHint: "Source and result update together", gridHint: "The source shows slice boundaries", autotileHint: "The output is ready for Godot",
			upload: "Click or drop an image", uploadHint: "PNG, JPG, or WebP, up to 10 MB. Paste also works", adjustments: "Adjustments", live: "Live", gridSettings: "Grid settings", autotileSettings: "Input settings", pixels: "Pixels",
			pixelStyle: "Style", stylePixel: "Pixel", stylePoster: "Poster", styleNoir: "Noir", styleDuotone: "Duotone", styleBlueprint: "Blueprint", styleSoft: "Soft", pixelSize: "Pixel block", palette: "Palette", paletteOriginal: "Original colors", background: "Background", backgroundTransparent: "Transparent", backgroundWhite: "White", backgroundBlack: "Black", outputScale: "Export scale", dither: "Light dithering",
			tileWidth: "Tile width", tileHeight: "Tile height", tileOffsetX: "Horizontal offset", tileOffsetY: "Vertical offset", tileMargin: "Outer margin", tileGap: "Tile gap", autotileFormat: "Input format", autotileFormat4x4: "Webtyler 4×4", autotileFormat3x3: "Webtyler 3×3", autotileFormat4x4plus: "Webtyler 4×4 Plus", autotileFormat3x3plus: "Webtyler 3×3 Plus", autotileFormat5x3: "Webtyler 5×3", autotileFormat5x2: "Webtyler 5×2", autotileFormat4x2: "Webtyler 4×2", autotileFormatBasic: "Basic", autotileFormatBasicBorder: "Basic Border", autotileFormatBasicFullBorder: "Basic Full Border", autotileFormatBasicLongBorder: "Basic Long Border", autotileFormatMinitiles: "Minitiles", autotileFormatRpgmaker: "RPG Maker", autotileOutput: "Output format", autotileOutputGodot: "Godot 12×4", autotileOutputRpgmaker: "RPG Maker 2×3", autotileOutputGamemaker: "GameMaker 12×4", autotileOutputPreview: "Preview 12×9", autotileSize: "Tile size", autotileLeft: "Left offset", autotileRight: "Right offset", autotileTop: "Top offset", autotileBottom: "Bottom offset",
			autotileSource: "Input atlas", autotileResult: "Autotile result", reset: "Clear", download: "Download PNG", original: "Original", result: "Pixelized result", sourceSheet: "Source sheet", tileResult: "Sliced result", empty: "Drop an image to start", services: "Public services", footer: "Local processing · No account · You keep the result",
			noImage: "Choose an image first", tooLarge: "Image is larger than 10 MB", badImage: "The image could not be read", noTiles: "These offset and size values do not produce a complete tile", badAutotile: "There is no complete input tile region at this offset", pixelStats: (width, height, pixelSize, palette, style) => `${width} × ${height}px · block ${pixelSize}${palette ? ` · ${palette} colors` : ""}${style ? ` · ${style}` : ""}`, tileStats: (columns, rows, width, height) => `${columns} × ${rows} tiles · output ${width} × ${height}px`, autotileStats: (format, output, width, height) => `${format} → ${output} · output ${width} × ${height}px`, pasteReady: "Image loaded from the clipboard", ready: "Generated and ready to download", downloaded: "Download started", cleared: "Cleared",
		},
	};

	const language = window.SayoriI18n?.language === "en" || document.documentElement.dataset.sayoriCurrentLanguage === "en" ? "en" : "zh";
	const strings = copy[language];
	const $ = (selector) => document.querySelector(selector);
	const state = {
		pixelizer: { image: null, name: "pixelized" },
		tiles: { image: null, name: "tiles" },
		autotile: { image: null, name: "autotile-47" },
	};
	const pasteHandlers = new Map();

	// Webtyler's published mappings. The output is 12×4; the blank slot is intentional.
	const MINITILES_DATA = [[[0,0],[[0,0],[0,0],[0,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0]]],[[1,0],[[0,0],[0,0],[2,0],[0,0],[0,0],[2,0],[1,0],[1,0],[3,0]]],[[2,0],[[2,0],[2,0],[2,0],[2,0],[2,0],[2,0],[3,0],[3,0],[3,0]]],[[3,0],[[2,0],[0,0],[0,0],[2,0],[0,0],[0,0],[3,0],[1,0],[1,0]]],[[4,0],[[4,0],[4,0],[3,0],[4,0],[4,0],[3,0],[3,0],[3,0],[3,0]]],[[5,0],[[2,0],[2,0],[2,0],[2,0],[4,0],[4,0],[3,0],[4,0],[4,0]]],[[6,0],[[2,0],[2,0],[2,0],[4,0],[4,0],[2,0],[4,0],[4,0],[3,0]]],[[7,0],[[3,0],[4,0],[4,0],[3,0],[4,0],[4,0],[3,0],[3,0],[3,0]]],[[8,0],[[0,0],[0,0],[2,0],[0,0],[4,0],[4,0],[1,0],[4,0],[4,0]]],[[9,0],[[3,0],[3,0],[3,0],[4,0],[4,0],[4,0],[4,0],[4,0],[4,0]]],[[10,0],[[2,0],[2,0],[2,0],[4,0],[4,0],[4,0],[4,0],[4,0],[4,0]]],[[11,0],[[2,0],[0,0],[0,0],[4,0],[4,0],[0,0],[4,0],[4,0],[1,0]]],[[0,1],[[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0]]],[[1,1],[[1,0],[1,0],[3,0],[1,0],[1,0],[3,0],[1,0],[1,0],[3,0]]],[[2,1],[[3,0],[3,0],[3,0],[3,0],[3,0],[3,0],[3,0],[3,0],[3,0]]],[[3,1],[[3,0],[1,0],[1,0],[3,0],[1,0],[1,0],[3,0],[1,0],[1,0]]],[[4,1],[[1,0],[1,0],[3,0],[1,0],[4,0],[4,0],[1,0],[4,0],[4,0]]],[[5,1],[[3,0],[4,0],[4,0],[4,0],[4,0],[4,0],[4,0],[4,0],[4,0]]],[[6,1],[[4,0],[4,0],[3,0],[4,0],[4,0],[4,0],[4,0],[4,0],[4,0]]],[[7,1],[[3,0],[1,0],[1,0],[4,0],[4,0],[1,0],[4,0],[4,0],[1,0]]],[[8,1],[[1,0],[4,0],[4,0],[1,0],[4,0],[4,0],[1,0],[4,0],[4,0]]],[[9,1],[[3,0],[4,0],[4,0],[4,0],[4,0],[4,0],[4,0],[4,0],[3,0]]],[[10,1],[[-1,-1],[-1,-1],[-1,-1],[-1,-1],[-1,-1],[-1,-1],[-1,-1],[-1,-1],[-1,-1]]],[[11,1],[[4,0],[4,0],[3,0],[4,0],[4,0],[3,0],[4,0],[4,0],[3,0]]],[[0,2],[[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[0,0]]],[[1,2],[[1,0],[1,0],[3,0],[0,0],[0,0],[2,0],[0,0],[0,0],[2,0]]],[[2,2],[[3,0],[3,0],[3,0],[2,0],[2,0],[2,0],[2,0],[2,0],[2,0]]],[[3,2],[[3,0],[1,0],[1,0],[2,0],[0,0],[0,0],[2,0],[0,0],[0,0]]],[[4,2],[[1,0],[4,0],[4,0],[1,0],[4,0],[4,0],[1,0],[1,0],[3,0]]],[[5,2],[[4,0],[4,0],[4,0],[4,0],[4,0],[4,0],[3,0],[4,0],[4,0]]],[[6,2],[[4,0],[4,0],[4,0],[4,0],[4,0],[4,0],[4,0],[4,0],[3,0]]],[[7,2],[[4,0],[4,0],[1,0],[4,0],[4,0],[1,0],[3,0],[1,0],[1,0]]],[[8,2],[[3,0],[4,0],[4,0],[3,0],[4,0],[4,0],[3,0],[4,0],[4,0]]],[[9,2],[[4,0],[4,0],[4,0],[4,0],[4,0],[4,0],[4,0],[4,0],[4,0]]],[[10,2],[[4,0],[4,0],[3,0],[4,0],[4,0],[4,0],[3,0],[4,0],[4,0]]],[[11,2],[[4,0],[4,0],[1,0],[4,0],[4,0],[1,0],[4,0],[4,0],[1,0]]],[[0,3],[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]]],[[1,3],[[0,0],[2,0],[2,0],[0,0],[2,0],[2,0],[0,0],[2,0],[2,0]]],[[2,3],[[2,0],[2,0],[2,0],[2,0],[2,0],[2,0],[2,0],[2,0],[2,0]]],[[3,3],[[2,0],[2,0],[0,0],[2,0],[2,0],[0,0],[2,0],[2,0],[0,0]]],[[4,3],[[3,0],[3,0],[3,0],[4,0],[4,0],[3,0],[4,0],[4,0],[3,0]]],[[5,3],[[3,0],[4,0],[4,0],[2,0],[4,0],[4,0],[2,0],[2,0],[2,0]]],[[6,3],[[4,0],[4,0],[3,0],[4,0],[4,0],[2,0],[2,0],[2,0],[2,0]]],[[7,3],[[3,0],[3,0],[3,0],[3,0],[4,0],[4,0],[3,0],[4,0],[4,0]]],[[8,3],[[1,0],[4,0],[4,0],[0,0],[4,0],[4,0],[0,0],[0,0],[2,0]]],[[9,3],[[4,0],[4,0],[4,0],[4,0],[4,0],[4,0],[2,0],[2,0],[2,0]]],[[10,3],[[4,0],[4,0],[4,0],[4,0],[4,0],[4,0],[3,0],[3,0],[3,0]]],[[11,3],[[4,0],[4,0],[1,0],[4,0],[4,0],[0,0],[2,0],[0,0],[0,0]]]];
	const FOUR_BY_FOUR_DATA = [[[0,0],[0,0]],[[1,0],[1,0]],[[2,0],[2,0]],[[3,0],[3,0]],[[0,1],[0,1]],[[1,1],[1,1]],[[2,1],[2,1]],[[3,1],[3,1]],[[0,2],[0,2]],[[1,2],[1,2]],[[2,2],[2,2]],[[3,2],[3,2]],[[0,3],[0,3]],[[1,3],[1,3]],[[2,3],[2,3]],[[3,3],[3,3]],[[4,0],[2,1]],[[5,0],[2,0]],[[6,0],[2,0]],[[7,0],[2,1]],[[4,1],[1,1]],[[5,1],[2,1]],[[6,1],[2,1]],[[7,1],[3,1]],[[4,2],[1,1]],[[5,2],[2,1]],[[6,2],[2,1]],[[7,2],[3,1]],[[4,3],[2,1]],[[5,3],[2,2]],[[6,3],[2,2]],[[7,3],[2,1]],[[8,0],[1,0]],[[9,0],[2,1]],[[10,0],[2,0]],[[11,0],[3,0]],[[8,1],[1,1]],[[9,1],[2,1]],[[10,1],[-1,-1]],[[11,1],[2,1]],[[8,2],[2,1]],[[9,2],[2,1]],[[10,2],[2,1]],[[11,2],[3,1]],[[8,3],[1,2]],[[9,3],[2,2]],[[10,3],[2,1]],[[11,3],[3,2]]];
	const THREE_BY_THREE_DATA = [[[0,0],[[0,0],[2,0],[2,0],[0,1],[2,1],[2,1],[0,1],[2,1],[2,1]]],[[1,0],[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]]],[[2,0],[[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0]]],[[3,0],[[2,0],[2,0],[2,0],[2,0],[2,0],[2,0],[2,0],[2,0],[2,0]]],[[0,1],[[0,1],[2,1],[2,1],[0,1],[2,1],[2,1],[0,1],[2,1],[2,1]]],[[1,1],[[0,1],[0,1],[0,1],[0,1],[0,1],[0,1],[0,1],[0,1],[0,1]]],[[2,1],[[1,1],[1,1],[1,1],[1,1],[1,1],[1,1],[1,1],[1,1],[1,1]]],[[3,1],[[2,1],[2,1],[2,1],[2,1],[2,1],[2,1],[2,1],[2,1],[2,1]]],[[0,2],[[0,1],[2,1],[2,1],[0,2],[2,2],[2,2],[0,2],[2,2],[2,2]]],[[1,2],[[0,2],[0,2],[0,2],[0,2],[0,2],[0,2],[0,2],[0,2],[0,2]]],[[2,2],[[1,2],[1,2],[1,2],[1,2],[1,2],[1,2],[1,2],[1,2],[1,2]]],[[3,2],[[2,2],[2,2],[2,2],[2,2],[2,2],[2,2],[2,2],[2,2],[2,2]]],[[0,3],[[0,0],[2,0],[2,0],[0,2],[2,2],[2,2],[0,2],[2,2],[2,2]]],[[1,3],[[0,0],[0,0],[0,0],[0,2],[0,2],[0,2],[0,2],[0,2],[0,2]]],[[2,3],[[1,0],[1,0],[1,0],[1,2],[1,2],[1,2],[1,2],[1,2],[1,2]]],[[3,3],[[2,0],[2,0],[2,0],[2,2],[2,2],[2,2],[2,2],[2,2],[2,2]]]];
	const INNER_CORNERS_DATA = [[[1,0],[[1,1]]],[[2,0],[[0,1],[1,1]]],[[3,0],[[0,1]]],[[1,1],[[1,1],[1,0]]],[[2,1],[[0,0],[0,1],[1,0],[1,1]]],[[3,1],[[0,0],[0,1]]],[[1,2],[[1,0]]],[[2,2],[[0,0],[1,0]]],[[3,2],[[0,0]]],[[4,0],[[0,1],[1,0],[1,1]]],[[5,0],[[0,1]]],[[6,0],[[1,1]]],[[7,0],[[0,1],[0,0],[1,1]]],[[4,1],[[1,0]]],[[5,1],[[0,0]]],[[6,1],[[1,0]]],[[7,1],[[0,0]]],[[4,2],[[1,1]]],[[5,2],[[0,1]]],[[6,2],[[1,1]]],[[7,2],[[0,1]]],[[4,3],[[0,0],[1,0],[1,1]]],[[5,3],[[0,0]]],[[6,3],[[1,0]]],[[7,3],[[0,1],[0,0],[1,0]]],[[9,0],[[0,0],[1,0]]],[[11,1],[[1,0],[1,1]]],[[8,2],[[0,0],[0,1]]],[[10,3],[[0,1],[1,1]]],[[9,1],[[0,0],[1,1]]],[[10,2],[[1,0],[0,1]]]];
	const GODOT_TO_GAMEMAKER = [43, 36, 24, 38, 15, 23, 22, 14, 35, 4, 21, 37, 33, 20, 16, 28, 18, 2, 3, 27, 17, 6, -1, 7, 45, 42, 32, 40, 19, 9, 5, 26, 10, 1, 11, 25, 47, 44, 34, 46, 8, 30, 31, 12, 41, 29, 13, 39];
	const PREVIEW_LAYOUT = [[null, null, 0], [null, 36, 14, 38, null, null, null, null, null, 0], [null, null, 23, null, null, null, null, null, null, 16, 11], [null, null, null, null, 35, null, 36, 37, 5, 17, 22, 38], [8, 11, null, null, null, null, null, null, 43, 45, 46], [20, 34, null, 0, null, null, null, null], [20, 18, 10, 9, 11, null, 8, 11], [20, 32, 32, 32, 34, null, 43, 33, 11], [43, 44, 44, 44, 46, null, null, 43, 46]];
	const INPUT_LAYOUTS = {
		basic: [2, 1], basicborder: [2, 1], basicfullborder: [3, 1], basiclongborder: [2, 1], minitiles: [5, 1],
		"4x4": [4, 4], "4x4plus": [5, 4], "3x3": [3, 3], "3x3plus": [4, 3], "5x3": [5, 3], "5x2": [5, 2], "4x2": [4, 2], rpgmaker: [2, 3],
	};

	document.title = `${strings.title} · ${strings.brand}`;
	document.querySelector('meta[name="description"]')?.setAttribute("content", strings.intro);
	document.querySelectorAll("[data-i18n]").forEach((node) => {
		const value = strings[node.dataset.i18n];
		if (value) node.textContent = value;
	});
	window.SayoriI18n?.ready?.();

	function status(message, kind = "") {
		const node = $("#tool-status");
		node.textContent = message;
		node.dataset.kind = kind;
	}

	function setOutputState(key, ready) {
		const label = $(`#panel-${key} .panel-output span:last-child`);
		if (label) label.textContent = ready ? strings.ready : strings.outputReady;
	}

	function bindTabs() {
		const tabs = [...document.querySelectorAll("[data-tool-tab]")];
		const activate = (button) => {
			const target = button.dataset.toolTab;
			tabs.forEach((item) => {
				const active = item === button;
				item.classList.toggle("is-active", active);
				item.setAttribute("aria-selected", String(active));
			});
			document.querySelectorAll(".tool-panel").forEach((panel) => {
				const active = panel.id === `panel-${target}`;
				panel.classList.toggle("is-active", active);
				panel.hidden = !active;
			});
			status("");
		};
		tabs.forEach((button, index) => {
			button.addEventListener("click", () => activate(button));
			button.addEventListener("keydown", (event) => {
				if (!(["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"].includes(event.key))) return;
				event.preventDefault();
				const direction = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
				const next = tabs[(index + direction + tabs.length) % tabs.length];
				activate(next);
				next.focus();
			});
		});
	}

	function bindImageInput(inputSelector, zoneSelector, key, render) {
		const input = $(inputSelector);
		const zone = $(zoneSelector);
		const accept = (file) => {
			if (!file) return;
			if (!file.type.startsWith("image/")) {
				status(strings.badImage, "error");
				return;
			}
			if (file.size > 10 * 1024 * 1024) {
				status(strings.tooLarge, "error");
				return;
			}
			const url = URL.createObjectURL(file);
			const image = new Image();
			image.onload = () => {
				state[key].image = image;
				state[key].name = file.name.replace(/\.[^.]+$/, "") || key;
				URL.revokeObjectURL(url);
				render();
				status(strings.ready, "success");
			};
			image.onerror = () => {
				URL.revokeObjectURL(url);
				status(strings.badImage, "error");
			};
			image.src = url;
		};
		input.addEventListener("change", () => accept(input.files?.[0]));
		["dragenter", "dragover"].forEach((eventName) => zone.addEventListener(eventName, (event) => {
			event.preventDefault();
			zone.classList.add("is-dragging");
		}));
		["dragleave", "drop"].forEach((eventName) => zone.addEventListener(eventName, (event) => {
			event.preventDefault();
			zone.classList.remove("is-dragging");
		}));
		zone.addEventListener("drop", (event) => accept(event.dataTransfer?.files?.[0]));
		pasteHandlers.set(key, accept);
	}

	function fitImage(image, maxDimension = 1800) {
		const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
		return { width: Math.max(1, Math.round(image.naturalWidth * scale)), height: Math.max(1, Math.round(image.naturalHeight * scale)), scale };
	}

	function drawSource(canvas, image, overlay = null) {
		const size = fitImage(image);
		canvas.width = size.width;
		canvas.height = size.height;
		const context = canvas.getContext("2d");
		context.clearRect(0, 0, size.width, size.height);
		context.imageSmoothingEnabled = false;
		context.drawImage(image, 0, 0, size.width, size.height);
		if (overlay) overlay(context, size.width, size.height, size.scale);
		return size;
	}

	function numberValue(selector, minimum = 0) {
		const value = Number($(selector).value);
		return Number.isFinite(value) ? Math.max(minimum, Math.floor(value)) : minimum;
	}

	function quantize(context, width, height, count, dither) {
		if (!count) return;
		const levels = Math.max(2, Math.round(Math.cbrt(count)));
		const step = 255 / (levels - 1);
		const pixels = context.getImageData(0, 0, width, height);
		const matrix = [[0, 2], [3, 1]];
		for (let y = 0; y < height; y += 1) {
			for (let x = 0; x < width; x += 1) {
				const index = (y * width + x) * 4;
				const offset = dither ? (matrix[y % 2][x % 2] - 1.5) * step * 0.16 : 0;
				for (let channel = 0; channel < 3; channel += 1) pixels.data[index + channel] = Math.max(0, Math.min(255, Math.round((pixels.data[index + channel] + offset) / step) * step));
			}
		}
		context.putImageData(pixels, 0, 0);
	}

	function applyPixelStyle(context, width, height, style) {
		if (style === "pixel") return;
		const pixels = context.getImageData(0, 0, width, height);
		const contrast = (value, amount) => Math.max(0, Math.min(255, (value - 128) * amount + 128));
		for (let index = 0; index < pixels.data.length; index += 4) {
			let red = pixels.data[index];
			let green = pixels.data[index + 1];
			let blue = pixels.data[index + 2];
			const luminance = red * .2126 + green * .7152 + blue * .0722;
			if (style === "noir") {
				red = green = blue = contrast(luminance, 1.25);
			} else if (style === "duotone") {
				const ratio = luminance / 255;
				red = 18 + (240 - 18) * ratio;
				green = 38 + (125 - 38) * ratio;
				blue = 47 + (125 - 47) * ratio;
			} else if (style === "blueprint") {
				const ratio = luminance / 255;
				red = 12 + 126 * ratio;
				green = 34 + 185 * ratio;
				blue = 42 + 174 * ratio;
			} else if (style === "poster") {
				const mean = (red + green + blue) / 3;
				red = contrast(mean + (red - mean) * 1.28, 1.32);
				green = contrast(mean + (green - mean) * 1.28, 1.32);
				blue = contrast(mean + (blue - mean) * 1.28, 1.32);
			} else if (style === "soft") {
				red = contrast(red, .84);
				green = contrast(green, .84);
				blue = contrast(blue, .84);
			}
			pixels.data[index] = Math.round(red);
			pixels.data[index + 1] = Math.round(green);
			pixels.data[index + 2] = Math.round(blue);
		}
		context.putImageData(pixels, 0, 0);
	}

	function renderPixelizer() {
		const image = state.pixelizer.image;
		const sourceCanvas = $("#pixel-source");
		const outputCanvas = $("#pixel-output");
		const info = $("#pixel-info");
		if (!image) {
			sourceCanvas.width = 0;
			outputCanvas.width = 0;
			info.textContent = "";
			$('[data-action="pixel-download"]').disabled = true;
			setOutputState("pixelizer", false);
			return;
		}
		const size = fitImage(image);
		drawSource(sourceCanvas, image);
		const pixelSize = numberValue("#pixel-size", 1);
		const style = $("#pixel-style").value;
		const small = document.createElement("canvas");
		small.width = Math.max(1, Math.ceil(size.width / pixelSize));
		small.height = Math.max(1, Math.ceil(size.height / pixelSize));
		const smallContext = small.getContext("2d");
		smallContext.imageSmoothingEnabled = true;
		smallContext.drawImage(image, 0, 0, small.width, small.height);
		applyPixelStyle(smallContext, small.width, small.height, style);
		const palette = numberValue("#palette-count", 0);
		quantize(smallContext, small.width, small.height, palette, $("#pixel-dither").checked);
		outputCanvas.width = size.width;
		outputCanvas.height = size.height;
		const outputContext = outputCanvas.getContext("2d");
		const background = $("#pixel-background").value;
		if (background !== "transparent") {
			outputContext.fillStyle = background === "black" ? "#000" : "#fff";
			outputContext.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
		}
		outputContext.imageSmoothingEnabled = false;
		outputContext.drawImage(small, 0, 0, size.width, size.height);
		const styleLabel = $("#pixel-style").selectedOptions[0]?.textContent || "";
		info.textContent = strings.pixelStats(size.width, size.height, pixelSize, palette, styleLabel);
		$('[data-action="pixel-download"]').disabled = false;
		setOutputState("pixelizer", true);
	}

	function renderTiles() {
		const image = state.tiles.image;
		const sourceCanvas = $("#tiles-source");
		const outputCanvas = $("#tiles-output");
		if (!image) {
			sourceCanvas.width = 0;
			outputCanvas.width = 0;
			$("#tiles-info").textContent = "";
			$('[data-action="tiles-download"]').disabled = true;
			setOutputState("tiles", false);
			return;
		}
		const tileWidth = numberValue("#tile-width", 1);
		const tileHeight = numberValue("#tile-height", 1);
		const offsetX = numberValue("#tile-offset-x", 0);
		const offsetY = numberValue("#tile-offset-y", 0);
		const margin = numberValue("#tile-margin", 0);
		const gap = numberValue("#tile-gap", 0);
		const availableWidth = image.naturalWidth - offsetX - margin * 2;
		const availableHeight = image.naturalHeight - offsetY - margin * 2;
		const columns = Math.floor((availableWidth + gap) / (tileWidth + gap));
		const rows = Math.floor((availableHeight + gap) / (tileHeight + gap));
		if (columns < 1 || rows < 1) {
			drawSource(sourceCanvas, image);
			outputCanvas.width = 0;
			$("#tiles-info").textContent = "";
			$('[data-action="tiles-download"]').disabled = true;
			setOutputState("tiles", false);
			status(strings.noTiles, "error");
			return;
		}
		drawSource(sourceCanvas, image, (context, width, height, scale) => {
			context.strokeStyle = "rgba(240, 125, 125, .9)";
			context.lineWidth = Math.max(1, 1 / scale);
			for (let row = 0; row < rows; row += 1) for (let column = 0; column < columns; column += 1) context.strokeRect((offsetX + margin + column * (tileWidth + gap)) * scale + .5, (offsetY + margin + row * (tileHeight + gap)) * scale + .5, tileWidth * scale, tileHeight * scale);
		});
		outputCanvas.width = columns * tileWidth + Math.max(0, columns - 1) * gap;
		outputCanvas.height = rows * tileHeight + Math.max(0, rows - 1) * gap;
		const outputContext = outputCanvas.getContext("2d");
		outputContext.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
		outputContext.imageSmoothingEnabled = false;
		for (let row = 0; row < rows; row += 1) for (let column = 0; column < columns; column += 1) outputContext.drawImage(image, offsetX + margin + column * (tileWidth + gap), offsetY + margin + row * (tileHeight + gap), tileWidth, tileHeight, column * (tileWidth + gap), row * (tileHeight + gap), tileWidth, tileHeight);
		$("#tiles-info").textContent = strings.tileStats(columns, rows, outputCanvas.width, outputCanvas.height);
		$('[data-action="tiles-download"]').disabled = false;
		setOutputState("tiles", true);
	}

	function copyTile(source, target, sourceX, sourceY, targetX, targetY, tileSize) {
		target.drawImage(source, sourceX * tileSize, sourceY * tileSize, tileSize, tileSize, targetX * tileSize, targetY * tileSize, tileSize, tileSize);
	}

	function copyTilePixels(source, target, targetTile, sourceTile, from, to, size, tileSize) {
		if (size[0] <= 0 || size[1] <= 0) return;
		const x = targetTile[0] * tileSize + to[0];
		const y = targetTile[1] * tileSize + to[1];
		const sourceX = sourceTile[0] * tileSize + from[0];
		const sourceY = sourceTile[1] * tileSize + from[1];
		target.clearRect(x, y, size[0], size[1]);
		target.drawImage(source, sourceX, sourceY, size[0], size[1], x, y, size[0], size[1]);
	}

	function copyTileSectionRaw(source, target, targetTile, section, sourceTile, tileSize, offsets) {
		const offX1 = Math.floor(tileSize / 2) + offsets.left;
		const offX2 = offX1 - offsets.left + offsets.right;
		const offY1 = Math.floor(tileSize / 2) + offsets.top;
		const offY2 = offY1 - offsets.top + offsets.bottom;
		const offsetX = [0, offX1, offX2][section[0]];
		const offsetY = [0, offY1, offY2][section[1]];
		const width = [offX1, offsets.right - offsets.left, tileSize - offX2][section[0]];
		const height = [offY1, offsets.bottom - offsets.top, tileSize - offY2][section[1]];
		copyTilePixels(source, target, targetTile, sourceTile, [offsetX, offsetY], [offsetX, offsetY], [width, height], tileSize);
	}

	function copyTileQuadRaw(source, target, targetTile, section, sourceTile, tileSize, offsets) {
		const offX1 = Math.floor(tileSize / 2) + offsets.left;
		const offX2 = offX1 - offsets.left + offsets.right;
		const offY1 = Math.floor(tileSize / 2) + offsets.top;
		const offY2 = offY1 - offsets.top + offsets.bottom;
		const offX = Math.floor(offX1 / 2 + offX2 / 2);
		const offY = Math.floor(offY1 / 2 + offY2 / 2);
		const offsetX = section[0] ? offX : 0;
		const offsetY = section[1] ? offY : 0;
		const width = section[0] ? tileSize - offX : offX;
		const height = section[1] ? tileSize - offY : offY;
		copyTilePixels(source, target, targetTile, sourceTile, [offsetX, offsetY], [offsetX, offsetY], [width, height], tileSize);
	}

	function copyTileSection(source, target, targetTile, section, data, tileSize, offsets) {
		const sourceTile = data[section[1] * 3 + section[0]];
		if (!sourceTile || sourceTile[0] < 0 || sourceTile[1] < 0) return;
		copyTileSectionRaw(source, target, targetTile, section, sourceTile, tileSize, offsets);
	}

	function applySubtileData(source, target, data, tileSize, offsets) {
		data.forEach(([targetTile, sections]) => {
			for (let y = 0; y < 3; y += 1) for (let x = 0; x < 3; x += 1) copyTileSection(source, target, targetTile, [x, y], sections, tileSize, offsets);
		});
	}

	function applyTileData(source, target, data, tileSize) {
		data.forEach(([targetTile, sourceTile]) => {
			if (sourceTile[0] >= 0 && sourceTile[1] >= 0) copyTile(source, target, sourceTile[0], sourceTile[1], targetTile[0], targetTile[1], tileSize);
		});
	}

	function createAtlas(tileSize) {
		const canvas = document.createElement("canvas");
		canvas.width = tileSize * 12;
		canvas.height = tileSize * 4;
		return canvas;
	}

	function createBasicBorderSource(image, tileSize, offsets, full) {
		const temp = document.createElement("canvas");
		temp.width = tileSize * 5;
		temp.height = tileSize;
		const context = temp.getContext("2d");
		copyTile(image, context, 0, 0, 0, 0, tileSize);
		for (let column = 1; column < 5; column += 1) copyTile(image, context, 1, 0, column, 0, tileSize);
		const verticalOffset = Math.floor(offsets.top / 2 + offsets.bottom / 2);
		const b = Math.floor(tileSize / 4 + verticalOffset);
		const c = Math.floor(tileSize * 3 / 4 + verticalOffset);
		const w1 = Math.floor(tileSize / 2 + offsets.left);
		const w2 = Math.floor(tileSize / 2 - offsets.right);
		copyTilePixels(image, context, [1, 0], [0, 0], [0, b], [0, b], [w1, c - b], tileSize);
		copyTilePixels(image, context, [1, 0], [0, 0], [0, c], [0, c], [w1, tileSize - c], tileSize);
		copyTilePixels(image, context, [1, 0], [0, 0], [0, b + tileSize - c], [0, 0], [w1, b], tileSize);
		const rightX = tileSize - w2;
		copyTilePixels(image, context, [1, 0], [0, 0], [rightX, b], [rightX, b], [w2, c - b], tileSize);
		copyTilePixels(image, context, [1, 0], [0, 0], [rightX, c], [rightX, c], [w2, tileSize - c], tileSize);
		copyTilePixels(image, context, [1, 0], [0, 0], [rightX, b + tileSize - c], [rightX, 0], [w2, b], tileSize);
		const horizontalOffset = Math.floor(offsets.left / 2 + offsets.right / 2);
		const bX = Math.floor(tileSize / 4 + horizontalOffset);
		const cX = Math.floor(tileSize * 3 / 4 + horizontalOffset);
		const h1 = Math.floor(tileSize / 2 + offsets.top);
		const h2 = Math.floor(tileSize / 2 - offsets.bottom);
		const bottomY = tileSize - h2;
		copyTilePixels(image, context, [2, 0], [0, 0], [bX, 0], [bX, 0], [cX - bX, h1], tileSize);
		copyTilePixels(image, context, [2, 0], [0, 0], [cX, 0], [cX, 0], [tileSize - cX, h1], tileSize);
		copyTilePixels(image, context, [2, 0], [0, 0], [bX + tileSize - cX, 0], [0, 0], [bX, h1], tileSize);
		copyTilePixels(image, context, [2, 0], [0, 0], [bX, bottomY], [bX, bottomY], [cX - bX, h2], tileSize);
		copyTilePixels(image, context, [2, 0], [0, 0], [cX, bottomY], [cX, bottomY], [tileSize - cX, h2], tileSize);
		copyTilePixels(image, context, [2, 0], [0, 0], [bX + tileSize - cX, bottomY], [0, bottomY], [bX, h2], tileSize);
		if (full) copyTile(image, context, 2, 0, 3, 0, tileSize);
		return temp;
	}

	function createRpgMakerSource(image, tileSize, offsets) {
		const temp = document.createElement("canvas");
		temp.width = tileSize * 5;
		temp.height = tileSize;
		const context = temp.getContext("2d");
		const quad = (target, section, sourceTile) => copyTileQuadRaw(image, context, target, section, sourceTile, tileSize, offsets);
		quad([0, 0], [0, 0], [0, 1]); quad([0, 0], [1, 0], [1, 1]); quad([0, 0], [0, 1], [0, 2]); quad([0, 0], [1, 1], [1, 2]);
		quad([1, 0], [0, 1], [0, 1]); quad([1, 0], [1, 1], [1, 1]); quad([1, 0], [0, 0], [0, 2]); quad([1, 0], [1, 0], [1, 2]);
		quad([2, 0], [1, 0], [0, 1]); quad([2, 0], [0, 0], [1, 1]); quad([2, 0], [1, 1], [0, 2]); quad([2, 0], [0, 1], [1, 2]);
		copyTile(image, context, 1, 0, 3, 0, tileSize);
		quad([4, 0], [1, 1], [0, 1]); quad([4, 0], [0, 1], [1, 1]); quad([4, 0], [1, 0], [0, 2]); quad([4, 0], [0, 0], [1, 2]);
		return temp;
	}

	function copyQuad(source, target, targetTile, section, sourceTile, tileSize, offsets) {
		copyTileQuadRaw(source, target, targetTile, section, sourceTile, tileSize, offsets);
	}

	function createGodotFrom5x3(image, tileSize, offsets) {
		const output = createAtlas(tileSize);
		const outputContext = output.getContext("2d");
		const intermediate = document.createElement("canvas");
		intermediate.width = tileSize * 4;
		intermediate.height = tileSize * 4;
		const intermediateContext = intermediate.getContext("2d");
		applySubtileData(image, intermediateContext, THREE_BY_THREE_DATA, tileSize, offsets);
		applyTileData(intermediate, outputContext, FOUR_BY_FOUR_DATA, tileSize);
		INNER_CORNERS_DATA.forEach(([targetTile, sections]) => sections.forEach((section) => copyQuad(image, outputContext, targetTile, [section[0] * 2, section[1] * 2], [4, 0], tileSize, offsets)));
		copyTile(image, outputContext, 3, 0, 0, 0, tileSize);
		copyTile(image, outputContext, 3, 1, 0, 2, tileSize);
		copyTile(image, outputContext, 4, 1, 0, 3, tileSize);
		copyTile(image, outputContext, 3, 2, 1, 3, tileSize);
		copyTile(image, outputContext, 4, 2, 3, 3, tileSize);
		return output;
	}

	function createGodotFrom5x2(image, tileSize, offsets) {
		const temp = document.createElement("canvas");
		temp.width = tileSize * 5;
		temp.height = tileSize * 3;
		const context = temp.getContext("2d");
		copyTile(image, context, 3, 0, 4, 1, tileSize); copyTile(image, context, 4, 0, 4, 0, tileSize);
		copyTile(image, context, 3, 1, 3, 2, tileSize); copyTile(image, context, 4, 1, 4, 2, tileSize);
		copyTile(image, context, 2, 0, 3, 0, tileSize); copyTile(image, context, 2, 1, 3, 1, tileSize);
		copyTile(image, context, 0, 0, 0, 0, tileSize); copyTile(image, context, 0, 1, 0, 2, tileSize);
		copyTile(image, context, 1, 0, 2, 0, tileSize); copyTile(image, context, 1, 1, 2, 2, tileSize);
		const quad = (target, section, sourceTile) => copyQuad(image, context, target, section, sourceTile, tileSize, offsets);
		quad([1, 0], [0, 0], [4, 1]); quad([1, 0], [1, 0], [3, 1]); quad([1, 0], [0, 1], [1, 0]); quad([1, 0], [1, 1], [0, 0]);
		quad([1, 2], [0, 1], [4, 1]); quad([1, 2], [1, 1], [3, 1]); quad([1, 2], [0, 0], [1, 1]); quad([1, 2], [1, 0], [0, 1]);
		quad([0, 1], [0, 1], [2, 0]); quad([0, 1], [0, 0], [2, 1]); quad([0, 1], [1, 1], [0, 0]); quad([0, 1], [1, 0], [0, 1]);
		quad([2, 1], [1, 1], [2, 0]); quad([2, 1], [1, 0], [2, 1]); quad([2, 1], [0, 1], [1, 0]); quad([2, 1], [0, 0], [1, 1]);
		quad([1, 1], [1, 1], [0, 0]); quad([1, 1], [0, 1], [1, 0]); quad([1, 1], [1, 0], [0, 1]); quad([1, 1], [0, 0], [1, 1]);
		return createGodotFrom5x3(temp, tileSize, offsets);
	}

	function createGodotFrom4x2(image, tileSize, offsets) {
		const temp = document.createElement("canvas");
		temp.width = tileSize * 5;
		temp.height = tileSize * 2;
		const context = temp.getContext("2d");
		copyTile(image, context, 0, 0, 0, 0, tileSize); copyTile(image, context, 0, 1, 0, 1, tileSize);
		copyTile(image, context, 1, 0, 1, 0, tileSize); copyTile(image, context, 1, 1, 1, 1, tileSize);
		copyTile(image, context, 3, 0, 4, 0, tileSize); copyTile(image, context, 2, 0, 3, 0, tileSize);
		const quad = (target, section, sourceTile) => copyQuad(image, context, target, section, sourceTile, tileSize, offsets);
		quad([2, 0], [0, 0], [2, 0]); quad([2, 0], [1, 0], [2, 0]); quad([2, 0], [0, 1], [2, 1]); quad([2, 0], [1, 1], [2, 1]);
		quad([2, 1], [0, 0], [2, 1]); quad([2, 1], [1, 0], [2, 1]); quad([2, 1], [0, 1], [2, 0]); quad([2, 1], [1, 1], [2, 0]);
		quad([3, 1], [0, 0], [2, 0]); quad([3, 1], [0, 1], [2, 0]); quad([3, 1], [1, 0], [3, 1]); quad([3, 1], [1, 1], [3, 1]);
		quad([4, 1], [0, 0], [3, 1]); quad([4, 1], [0, 1], [3, 1]); quad([4, 1], [1, 0], [2, 0]); quad([4, 1], [1, 1], [2, 0]);
		return createGodotFrom5x2(temp, tileSize, offsets);
	}

	function createGodotAtlas(image, format, tileSize, offsets) {
		const [columns, rows] = INPUT_LAYOUTS[format] || [4, 4];
		const originX = Math.max(0, offsets.left);
		const originY = Math.max(0, offsets.top);
		if (image.naturalWidth < originX + columns * tileSize + Math.max(0, offsets.right) || image.naturalHeight < originY + rows * tileSize + Math.max(0, offsets.bottom)) return null;
		if (format === "minitiles") {
			const output = createAtlas(tileSize);
			applySubtileData(image, output.getContext("2d"), MINITILES_DATA, tileSize, offsets);
			return output;
		}
		if (format === "basic") {
			const output = createAtlas(tileSize);
			const source = document.createElement("canvas");
			source.width = tileSize * 5; source.height = tileSize;
			const context = source.getContext("2d");
			copyTile(image, context, 0, 0, 0, 0, tileSize);
			for (let column = 1; column < 5; column += 1) copyTile(image, context, 1, 0, column, 0, tileSize);
			applySubtileData(source, output.getContext("2d"), MINITILES_DATA, tileSize, offsets);
			return output;
		}
		if (format === "basicborder" || format === "basicfullborder") {
			const output = createAtlas(tileSize);
			applySubtileData(createBasicBorderSource(image, tileSize, offsets, format === "basicfullborder"), output.getContext("2d"), MINITILES_DATA, tileSize, offsets);
			return output;
		}
		if (format === "basiclongborder") {
			const source = document.createElement("canvas");
			source.width = tileSize * 5; source.height = tileSize;
			const context = source.getContext("2d");
			for (let column = 0; column < 4; column += 1) copyTile(image, context, 0, 0, column, 0, tileSize);
			copyTile(image, context, 1, 0, 4, 0, tileSize);
			const output = createAtlas(tileSize);
			applySubtileData(source, output.getContext("2d"), MINITILES_DATA, tileSize, offsets);
			return output;
		}
		if (format === "3x3") {
			const intermediate = document.createElement("canvas");
			intermediate.width = tileSize * 4; intermediate.height = tileSize * 4;
			applySubtileData(image, intermediate.getContext("2d"), THREE_BY_THREE_DATA, tileSize, offsets);
			const output = createAtlas(tileSize);
			applyTileData(intermediate, output.getContext("2d"), FOUR_BY_FOUR_DATA, tileSize);
			return output;
		}
		if (format === "3x3plus") {
			const output = createGodotAtlas(image, "3x3", tileSize, offsets);
			const context = output.getContext("2d");
			INNER_CORNERS_DATA.forEach(([targetTile, sections]) => sections.forEach((section) => copyQuad(image, context, targetTile, [section[0] * 2, section[1] * 2], [3, 0], tileSize, offsets)));
			return output;
		}
		if (format === "4x4") {
			const output = createAtlas(tileSize);
			applyTileData(image, output.getContext("2d"), FOUR_BY_FOUR_DATA, tileSize);
			return output;
		}
		if (format === "4x4plus") {
			const output = createGodotAtlas(image, "4x4", tileSize, offsets);
			const context = output.getContext("2d");
			INNER_CORNERS_DATA.forEach(([targetTile, sections]) => sections.forEach((section) => copyQuad(image, context, targetTile, [section[0] * 2, section[1] * 2], [4, 0], tileSize, offsets)));
			return output;
		}
		if (format === "5x3") return createGodotFrom5x3(image, tileSize, offsets);
		if (format === "5x2") return createGodotFrom5x2(image, tileSize, offsets);
		if (format === "4x2") return createGodotFrom4x2(image, tileSize, offsets);
		if (format === "rpgmaker") {
			const output = createAtlas(tileSize);
			applySubtileData(createRpgMakerSource(image, tileSize, offsets), output.getContext("2d"), MINITILES_DATA, tileSize, offsets);
			return output;
		}
		return null;
	}

	function renderAutotileOutput(godot, outputFormat, tileSize) {
		const output = document.createElement("canvas");
		const outputContext = output.getContext("2d");
		outputContext.imageSmoothingEnabled = false;
		if (outputFormat === "rpgmaker") {
			output.width = tileSize * 2;
			output.height = tileSize * 3;
			[[0, 3], [2, 1], [8, 0], [11, 0], [8, 3], [11, 3]].forEach(([sourceX, sourceY], index) => copyTile(godot, outputContext, sourceX, sourceY, index % 2, Math.floor(index / 2), tileSize));
			return output;
		}
		if (outputFormat === "gamemaker") {
			output.width = tileSize * 12;
			output.height = tileSize * 4;
			GODOT_TO_GAMEMAKER.forEach((targetIndex, sourceIndex) => {
				if (targetIndex < 0) return;
				copyTile(godot, outputContext, sourceIndex % 12, Math.floor(sourceIndex / 12), targetIndex % 12, Math.floor(targetIndex / 12), tileSize);
			});
			return output;
		}
		if (outputFormat === "preview") {
			output.width = tileSize * 12;
			output.height = tileSize * 9;
			PREVIEW_LAYOUT.forEach((row, y) => row.forEach((sourceIndex, x) => {
				if (sourceIndex === null || sourceIndex < 0) return;
				const adjustedIndex = sourceIndex >= 22 ? sourceIndex + 1 : sourceIndex;
				copyTile(godot, outputContext, adjustedIndex % 12, Math.floor(adjustedIndex / 12), x, y, tileSize);
			}));
			return output;
		}
		output.width = godot.width;
		output.height = godot.height;
		outputContext.drawImage(godot, 0, 0);
		return output;
	}

	function renderAutoTile() {
		const image = state.autotile.image;
		const sourceCanvas = $("#autotile-source");
		const outputCanvas = $("#autotile-output");
		const info = $("#autotile-info");
		const downloadButton = $('[data-action="autotile-download"]');
		info.textContent = "";
		if (!image) {
			sourceCanvas.width = 0;
			outputCanvas.width = 0;
			downloadButton.disabled = true;
			setOutputState("autotile", false);
			return;
		}
		const inputFormat = $("#autotile-format").value;
		const outputFormat = $("#autotile-output-format").value;
		const sourceLabel = $("#autotile-source-label");
		if (sourceLabel) sourceLabel.textContent = $("#autotile-format").selectedOptions[0]?.textContent || strings.autotileSource;
		const tileSize = numberValue("#autotile-size", 1);
		const offsets = {
			left: Number($("#autotile-left-offset").value) || 0,
			right: Number($("#autotile-right-offset").value) || 0,
			top: Number($("#autotile-top-offset").value) || 0,
			bottom: Number($("#autotile-bottom-offset").value) || 0,
		};
		const [columns, rows] = INPUT_LAYOUTS[inputFormat] || [4, 4];
		const originX = Math.max(0, offsets.left);
		const originY = Math.max(0, offsets.top);
		drawSource(sourceCanvas, image, (context, width, height, scale) => {
			context.strokeStyle = "rgba(240, 125, 125, .9)";
			context.lineWidth = Math.max(1, 1 / scale);
			for (let row = 0; row < rows; row += 1) for (let column = 0; column < columns; column += 1) context.strokeRect((originX + column * tileSize) * scale + .5, (originY + row * tileSize) * scale + .5, tileSize * scale, tileSize * scale);
		});
		const godot = createGodotAtlas(image, inputFormat, tileSize, offsets);
		if (!godot) {
			outputCanvas.width = 0;
			downloadButton.disabled = true;
			setOutputState("autotile", false);
			status(strings.badAutotile, "error");
			return;
		}
		const result = renderAutotileOutput(godot, outputFormat, tileSize);
		outputCanvas.width = result.width;
		outputCanvas.height = result.height;
		outputCanvas.getContext("2d").drawImage(result, 0, 0);
		const inputLabel = $("#autotile-format").selectedOptions[0]?.textContent || inputFormat;
		const outputLabel = $("#autotile-output-format").selectedOptions[0]?.textContent || outputFormat;
		info.textContent = strings.autotileStats(inputLabel, outputLabel, outputCanvas.width, outputCanvas.height);
		downloadButton.disabled = false;
		setOutputState("autotile", true);
	}

	function download(canvas, filename, scale = 1) {
		if (!canvas.width || !canvas.height) {
			status(strings.noImage, "error");
			return;
		}
		const exportCanvas = scale === 1 ? canvas : document.createElement("canvas");
		if (scale !== 1) {
			exportCanvas.width = canvas.width * scale;
			exportCanvas.height = canvas.height * scale;
			const exportContext = exportCanvas.getContext("2d");
			exportContext.imageSmoothingEnabled = false;
			exportContext.drawImage(canvas, 0, 0, exportCanvas.width, exportCanvas.height);
		}
		exportCanvas.toBlob((blob) => {
			if (!blob) return;
			const link = document.createElement("a");
			link.href = URL.createObjectURL(blob);
			link.download = `${filename}.png`;
			link.click();
			setTimeout(() => URL.revokeObjectURL(link.href), 0);
			status(strings.downloaded, "success");
		}, "image/png");
	}

	function clearTool(key, render, inputSelector, canvasSelectors) {
		state[key].image = null;
		$(inputSelector).value = "";
		canvasSelectors.forEach((selector) => {
			const canvas = $(selector);
			canvas.width = 0;
			canvas.height = 0;
		});
		render();
		status(strings.cleared);
	}

	bindTabs();
	bindImageInput("#pixel-file", "label[for='pixel-file']", "pixelizer", renderPixelizer);
	bindImageInput("#tiles-file", "label[for='tiles-file']", "tiles", renderTiles);
	bindImageInput("#autotile-file", "label[for='autotile-file']", "autotile", renderAutoTile);
	$("#pixel-size").addEventListener("input", () => { $("#pixel-size-value").value = $("#pixel-size").value; renderPixelizer(); });
	$("#pixel-style").addEventListener("change", renderPixelizer);
	$("#palette-count").addEventListener("change", renderPixelizer);
	$("#pixel-background").addEventListener("change", renderPixelizer);
	$("#pixel-dither").addEventListener("change", renderPixelizer);
	["#tile-width", "#tile-height", "#tile-offset-x", "#tile-offset-y", "#tile-margin", "#tile-gap"].forEach((selector) => $(selector).addEventListener("input", renderTiles));
	["#autotile-size", "#autotile-left-offset", "#autotile-right-offset", "#autotile-top-offset", "#autotile-bottom-offset"].forEach((selector) => $(selector).addEventListener("input", renderAutoTile));
	["#autotile-format", "#autotile-output-format"].forEach((selector) => $(selector).addEventListener("change", renderAutoTile));
	$('[data-action="pixel-download"]').addEventListener("click", () => download($("#pixel-output"), state.pixelizer.name, numberValue("#pixel-output-scale", 1)));
	$('[data-action="tiles-download"]').addEventListener("click", () => download($("#tiles-output"), `${state.tiles.name}-atlas`));
	$('[data-action="autotile-download"]').addEventListener("click", () => download($("#autotile-output"), state.autotile.name));
	$('[data-action="pixel-reset"]').addEventListener("click", () => clearTool("pixelizer", renderPixelizer, "#pixel-file", ["#pixel-source", "#pixel-output"]));
	$('[data-action="tiles-reset"]').addEventListener("click", () => clearTool("tiles", renderTiles, "#tiles-file", ["#tiles-source", "#tiles-output"]));
	$('[data-action="autotile-reset"]').addEventListener("click", () => clearTool("autotile", renderAutoTile, "#autotile-file", ["#autotile-source", "#autotile-output"]));
	document.addEventListener("paste", (event) => {
		const file = [...(event.clipboardData?.items || [])].find((item) => item.type.startsWith("image/"))?.getAsFile();
		if (!file) return;
		const activeKey = document.querySelector(".tool-tab.is-active")?.dataset.toolTab || "pixelizer";
		pasteHandlers.get(activeKey)?.(file);
		status(strings.pasteReady, "success");
	});
})();
