export type ComposeImageOptions = {
  baseImage: string;
  message?: string;
  selectedFont: string;
  fontSize: number;
  textColor: string;
  textPos: { x: number; y: number };
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const characters = Array.from(text.trim());
  const lines: string[] = [];
  let currentLine = "";
  let truncated = false;

  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index];

    if (character === "\n") {
      lines.push(currentLine.trim());
      currentLine = "";
    } else {
      const candidate = currentLine + character;
      if (currentLine && ctx.measureText(candidate).width > maxWidth) {
        lines.push(currentLine.trim());
        currentLine = character.trimStart();
      } else {
        currentLine = candidate;
      }
    }

    if (lines.length >= maxLines) {
      truncated = index < characters.length - 1 || Boolean(currentLine);
      break;
    }
  }

  if (lines.length < maxLines && currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  const visibleLines = lines.slice(0, maxLines);
  if (truncated && visibleLines.length) {
    let lastLine = visibleLines[visibleLines.length - 1].replace(/…$/, "");
    while (lastLine && ctx.measureText(`${lastLine}…`).width > maxWidth) {
      lastLine = lastLine.slice(0, -1);
    }
    visibleLines[visibleLines.length - 1] = `${lastLine.trimEnd()}…`;
  }

  return visibleLines;
}

function drawRoundedLogoBox(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  logo: HTMLImageElement
) {
  const logoHeight = canvas.height * 0.04;
  const scale = logoHeight / logo.height;
  const logoWidth = logo.width * scale;

  const padding = canvas.height * 0.01;
  const boxWidth = logoWidth + padding * 2;
  const boxHeight = logoHeight + padding * 2;
  const boxX = canvas.width - boxWidth - padding;
  const boxY = padding;
  const radius = canvas.height * 0.01;

  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.beginPath();
  ctx.moveTo(boxX + radius, boxY);
  ctx.lineTo(boxX + boxWidth - radius, boxY);
  ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + radius);
  ctx.lineTo(boxX + boxWidth, boxY + boxHeight - radius);
  ctx.quadraticCurveTo(
    boxX + boxWidth,
    boxY + boxHeight,
    boxX + boxWidth - radius,
    boxY + boxHeight
  );
  ctx.lineTo(boxX + radius, boxY + boxHeight);
  ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - radius);
  ctx.lineTo(boxX, boxY + radius);
  ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
  ctx.closePath();
  ctx.fill();

  ctx.drawImage(logo, boxX + padding, boxY + padding, logoWidth, logoHeight);
}

export async function composeFinalImage(
  canvas: HTMLCanvasElement,
  options: ComposeImageOptions
): Promise<string> {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context not available");

  const { baseImage, message, selectedFont, fontSize, textColor, textPos } =
    options;
  const img = await loadImage(baseImage);

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  if (message) {
    ctx.fillStyle = textColor;
    const fontSizePx = Math.floor(canvas.height * (fontSize / 100));
    ctx.font = `bold ${fontSizePx}px ${selectedFont}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;

    const maxTextWidth = canvas.width * 0.86;
    const lines = wrapText(ctx, message, maxTextWidth, 3);
    const lineHeight = fontSizePx * 1.2;
    const widestLine = Math.max(
      fontSizePx,
      ...lines.map((line) => ctx.measureText(line).width),
    );
    const halfTextWidth = widestLine / 2;
    const horizontalMargin = canvas.width * 0.02;
    const requestedX = (canvas.width * textPos.x) / 100;
    const textX = Math.min(
      canvas.width - horizontalMargin - halfTextWidth,
      Math.max(horizontalMargin + halfTextWidth, requestedX),
    );

    const verticalMargin = canvas.height * 0.03 + fontSizePx / 2;
    const requestedCenterY = (canvas.height * textPos.y) / 100;
    const halfBlockHeight = ((lines.length - 1) * lineHeight) / 2;
    const centerY = Math.min(
      canvas.height - verticalMargin - halfBlockHeight,
      Math.max(verticalMargin + halfBlockHeight, requestedCenterY),
    );

    lines.forEach((line, index) => {
      const y = centerY + (index - (lines.length - 1) / 2) * lineHeight;
      ctx.fillText(line, textX, y, maxTextWidth);
    });
    ctx.shadowColor = "transparent";
  }

  try {
    const logo = await loadImage("/logo.png");
    drawRoundedLogoBox(ctx, canvas, logo);
  } catch {
    const fallbackText = "DSHS AI Booth";
    ctx.fillStyle = "black";
    ctx.font = `bold ${Math.floor(canvas.height * 0.02)}px sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText(fallbackText, canvas.width - 40, 40);
  }

  return canvas.toDataURL("image/jpeg", 0.95);
}
