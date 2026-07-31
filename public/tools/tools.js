(() => {
	"use strict";

	const copy = {
		zh: {
			brand: "Amiya的书桌", back: "回书桌", eyebrow: "sayori.org / tools", title: "小工具台",
			intro: "几个在浏览器里直接处理素材的小工具，原图不上传，结果自己带走", privacy: "所有处理都在当前设备完成，关闭页面后不会留下服务端文件",
			pixelTab: "像素化", tilesTab: "图块切片", pixelKicker: "01 / pixelizer", pixelTitle: "把图片变成像素画", pixelIntro: "控制像素块大小和颜色数量，预览后下载 PNG",
			tilesKicker: "02 / tile sheet", tilesTitle: "把素材整理成图块图集", tilesIntro: "输入图块尺寸，自动裁切为规则图集并下载",
			upload: "点击或拖入图片", uploadHint: "PNG、JPG、WebP，最大 10 MB", pixelSize: "像素块", palette: "颜色数量", paletteOriginal: "保留原色", background: "背景", backgroundTransparent: "透明", backgroundWhite: "白色", backgroundBlack: "黑色", dither: "轻微抖动",
			tileWidth: "图块宽度", tileHeight: "图块高度", tileMargin: "四周边距", tileGap: "图块间距", reset: "清空", download: "下载 PNG", original: "原图", result: "像素化结果", sourceSheet: "原始图集", tileResult: "切片结果", empty: "等待图片", services: "公共服务说明", footer: "本地处理 · 无需账号 · 结果由你保存",
			noImage: "先选择一张图片", tooLarge: "图片超过 10 MB", badImage: "图片无法读取", noTiles: "当前尺寸无法切出完整图块", tileStats: (columns, rows, width, height) => `${columns} × ${rows} 个图块 · 输出 ${width} × ${height}px`, ready: "已生成，可以下载", cleared: "已清空",
		},
		en: {
			brand: "Amiya's Desk", back: "Back to desk", eyebrow: "sayori.org / tools", title: "Tiny tool bench",
			intro: "Small browser tools for working with image assets. Originals stay local and results are yours to keep", privacy: "Processing happens on this device. No source file is sent to a server",
			pixelTab: "Pixelizer", tilesTab: "Tile slicer", pixelKicker: "01 / pixelizer", pixelTitle: "Turn an image into pixel art", pixelIntro: "Adjust block size and palette, preview it, then download a PNG",
			tilesKicker: "02 / tile sheet", tilesTitle: "Pack an image into a tile sheet", tilesIntro: "Set tile dimensions, slice complete tiles, and download the atlas",
			upload: "Click or drop an image", uploadHint: "PNG, JPG, or WebP, up to 10 MB", pixelSize: "Pixel block", palette: "Palette", paletteOriginal: "Original colors", background: "Background", backgroundTransparent: "Transparent", backgroundWhite: "White", backgroundBlack: "Black", dither: "Light dithering",
			tileWidth: "Tile width", tileHeight: "Tile height", tileMargin: "Outer margin", tileGap: "Tile gap", reset: "Clear", download: "Download PNG", original: "Original", result: "Pixelized result", sourceSheet: "Source sheet", tileResult: "Sliced result", empty: "Waiting for an image", services: "Public services", footer: "Local processing · No account · You keep the result",
			noImage: "Choose an image first", tooLarge: "Image is larger than 10 MB", badImage: "The image could not be read", noTiles: "These dimensions do not produce a complete tile", tileStats: (columns, rows, width, height) => `${columns} × ${rows} tiles · output ${width} × ${height}px`, ready: "Generated and ready to download", cleared: "Cleared",
		},
	};

	const language = window.SayoriI18n?.language === "en" ? "en" : "zh";
	const strings = copy[language];
	const $ = (selector) => document.querySelector(selector);
	const state = {
		pixelizer: { image: null, name: "pixelized" },
		tiles: { image: null, name: "tiles" },
	};

	document.title = `${strings.title} · ${strings.brand}`;
	document.querySelector('meta[name="description"]')?.setAttribute("content", strings.intro);
	document.querySelectorAll("[data-i18n]").forEach((node) => {
		const value = strings[node.dataset.i18n];
		if (value) node.textContent = value;
	});

	function status(message, kind = "") {
		const node = $("#tool-status");
		node.textContent = message;
		node.dataset.kind = kind;
	}

	function bindTabs() {
		document.querySelectorAll("[data-tool-tab]").forEach((button) => {
			button.addEventListener("click", () => {
				const target = button.dataset.toolTab;
				document.querySelectorAll("[data-tool-tab]").forEach((item) => {
					const active = item === button;
					item.classList.toggle("is-active", active);
					item.setAttribute("aria-selected", String(active));
				});
				document.querySelectorAll(".tool-panel").forEach((panel) => {
					const active = panel.id === `panel-${target}`;
					panel.classList.toggle("is-active", active);
					panel.hidden = !active;
				});
			});
		});
	}

	function bindImageInput(inputSelector, zoneSelector, key, render) {
		const input = $(inputSelector);
		const zone = $(zoneSelector);
		const accept = (file) => {
			if (!file) return;
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
		if (overlay) overlay(context, size.width, size.height);
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

	function renderPixelizer() {
		const image = state.pixelizer.image;
		const sourceCanvas = $("#pixel-source");
		const outputCanvas = $("#pixel-output");
		if (!image) {
			sourceCanvas.width = 0;
			outputCanvas.width = 0;
			$("[data-action='pixel-download']").disabled = true;
			return;
		}
		const size = fitImage(image);
		drawSource(sourceCanvas, image);
		const pixelSize = Number($("#pixel-size").value);
		const small = document.createElement("canvas");
		small.width = Math.max(1, Math.ceil(size.width / pixelSize));
		small.height = Math.max(1, Math.ceil(size.height / pixelSize));
		const smallContext = small.getContext("2d");
		smallContext.imageSmoothingEnabled = true;
		smallContext.drawImage(image, 0, 0, small.width, small.height);
		quantize(smallContext, small.width, small.height, Number($("#palette-count").value), $("#pixel-dither").checked);
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
		$("[data-action='pixel-download']").disabled = false;
	}

	function renderTiles() {
		const image = state.tiles.image;
		const sourceCanvas = $("#tiles-source");
		const outputCanvas = $("#tiles-output");
		if (!image) {
			sourceCanvas.width = 0;
			outputCanvas.width = 0;
			$("#tiles-info").textContent = "";
			$("[data-action='tiles-download']").disabled = true;
			return;
		}
		const size = fitImage(image);
		const tileWidth = Number($("#tile-width").value);
		const tileHeight = Number($("#tile-height").value);
		const margin = Number($("#tile-margin").value);
		const gap = Number($("#tile-gap").value);
		const columns = Math.floor((size.width - margin * 2 + gap) / (tileWidth + gap));
		const rows = Math.floor((size.height - margin * 2 + gap) / (tileHeight + gap));
		if (columns < 1 || rows < 1) {
			drawSource(sourceCanvas, image);
			outputCanvas.width = 0;
			$("#tiles-info").textContent = "";
			$("[data-action='tiles-download']").disabled = true;
			status(strings.noTiles, "error");
			return;
		}
		drawSource(sourceCanvas, image, (context) => {
			context.strokeStyle = "rgba(191, 105, 112, .7)";
			context.lineWidth = 1;
			for (let row = 0; row < rows; row += 1) for (let column = 0; column < columns; column += 1) context.strokeRect(margin + column * (tileWidth + gap) + .5, margin + row * (tileHeight + gap) + .5, tileWidth, tileHeight);
		});
		outputCanvas.width = columns * tileWidth + Math.max(0, columns - 1) * gap;
		outputCanvas.height = rows * tileHeight + Math.max(0, rows - 1) * gap;
		const outputContext = outputCanvas.getContext("2d");
		outputContext.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
		outputContext.imageSmoothingEnabled = false;
		for (let row = 0; row < rows; row += 1) for (let column = 0; column < columns; column += 1) outputContext.drawImage(image, margin + column * (tileWidth + gap), margin + row * (tileHeight + gap), tileWidth, tileHeight, column * (tileWidth + gap), row * (tileHeight + gap), tileWidth, tileHeight);
		$("#tiles-info").textContent = strings.tileStats(columns, rows, outputCanvas.width, outputCanvas.height);
		$("[data-action='tiles-download']").disabled = false;
	}

	function download(canvas, filename) {
		if (!canvas.width || !canvas.height) return;
		canvas.toBlob((blob) => {
			if (!blob) return;
			const link = document.createElement("a");
			link.href = URL.createObjectURL(blob);
			link.download = `${filename}.png`;
			link.click();
			setTimeout(() => URL.revokeObjectURL(link.href), 0);
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
		status(strings.cleared, "");
	}

	bindTabs();
	bindImageInput("#pixel-file", "label[for='pixel-file']", "pixelizer", renderPixelizer);
	bindImageInput("#tiles-file", "label[for='tiles-file']", "tiles", renderTiles);
	$("#pixel-size").addEventListener("input", () => { $("#pixel-size-value").value = $("#pixel-size").value; renderPixelizer(); });
	$("#palette-count").addEventListener("change", renderPixelizer);
	$("#pixel-background").addEventListener("change", renderPixelizer);
	$("#pixel-dither").addEventListener("change", renderPixelizer);
	["#tile-width", "#tile-height", "#tile-margin", "#tile-gap"].forEach((selector) => $(selector).addEventListener("input", renderTiles));
	$("[data-action='pixel-download']").addEventListener("click", () => download($("#pixel-output"), state.pixelizer.name));
	$("[data-action='tiles-download']").addEventListener("click", () => download($("#tiles-output"), `${state.tiles.name}-atlas`));
	$("[data-action='pixel-reset']").addEventListener("click", () => clearTool("pixelizer", renderPixelizer, "#pixel-file", ["#pixel-source", "#pixel-output"]));
	$("[data-action='tiles-reset']").addEventListener("click", () => clearTool("tiles", renderTiles, "#tiles-file", ["#tiles-source", "#tiles-output"]));
})();
