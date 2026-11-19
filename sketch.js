// ===== 圖片與影格參數設定 =====
let stopSheet; // 角色 1 靜止精靈圖變數
let bgImage; // 背景圖片變數（雲.png）
let bgLoaded = false; // 記錄背景圖片是否成功載入

let stopFrame = 0; // 目前靜止動畫影格索引（從 0 開始）
let lastFrameTime = 0; // 上次切換影格的時間戳記（毫秒）

const stopFrameCount = 14; // 靜止精靈圖總影格數
const stopSheetWidth = 1955; // 靜止精靈圖原始總寬度
const stopSheetHeight = 212; // 靜止精靈圖原始高度
const frameDuration = 100; // 每個影格停留時間（100 毫秒）

// ===== 角色與背景捲動狀態 =====
let characterX = 0; // 角色 1 在畫面中的水平中心 X 座標
let backgroundCameraX = 0; // 背景鏡頭在三張串接背景上的 X 位置
const moveSpeed = 8; // 每次按方向鍵的移動速度（像素）

function preload() {
  // 預先載入角色 1 靜止精靈圖
  stopSheet = loadImage("1/stop/stop.png");

  // 載入背景圖片（成功時將 bgLoaded 設為 true；若失敗則自動嘗試其他常見路徑）
  bgImage = loadImage(
    "1/背景/雲.png",
    () => {
      bgLoaded = true;
    },
    () => {
      // 備用路徑 1：若 index.html 在較外層目錄時
      bgImage = loadImage(
        "20261110-main/20261110-main/1/背景/雲.png",
        () => {
          bgLoaded = true;
        },
        () => {
          // 備用路徑 2：若放在 bg 資料夾內
          bgImage = loadImage("bg/0.png", () => {
            bgLoaded = true;
          });
        }
      );
    }
  );
}

function setup() {
  // 建立與瀏覽器視窗同寬高的全螢幕畫布
  createCanvas(windowWidth, windowHeight);

  // 初始化角色 1 位於畫面水平中央
  characterX = width / 2;

  // 計算單張背景等比縮放後的寬度，並將鏡頭初始置於三張串接背景的中間
  const tileWidth = getBackgroundTileWidth();
  const maxCameraX = max(0, tileWidth * 3 - width);
  backgroundCameraX = maxCameraX / 2;
}

// 依照畫布高度等比例計算單張背景圖的顯示寬度
function getBackgroundTileWidth() {
  if (!bgLoaded || !bgImage || bgImage.height === 0) {
    return width;
  }
  return (bgImage.width / bgImage.height) * height;
}

function draw() {
  // 墊底淺紫色背景
  background(230, 215, 255);

  // 計算單張背景寬度與三張串接後的最大捲動距離
  const tileWidth = getBackgroundTileWidth();
  const totalBgWidth = tileWidth * 3;
  const maxCameraX = max(0, totalBgWidth - width);
  const centerX = width / 2;

  // 計算角色 1 顯示尺寸（高度為畫布 1/3，寬度依原圖寬高比等比縮放）
  const sourceFrameWidth = stopSheetWidth / stopFrameCount;
  const displayHeight = height / 3;
  const displayWidth = sourceFrameWidth * (displayHeight / stopSheetHeight);
  const halfCharWidth = displayWidth / 2;

  // 偵測方向鍵輸入
  const pressingRight = keyIsDown(RIGHT_ARROW);
  const pressingLeft = keyIsDown(LEFT_ARROW);

  if (pressingRight && !pressingLeft) {
    // 按下往右鍵：
    // 1. 若角色原本在畫面左半邊（從最左端往回走），先讓角色走回畫面中央
    if (characterX < centerX) {
      characterX = min(centerX, characterX + moveSpeed);
    } else if (backgroundCameraX < maxCameraX) {
      // 2. 角色在中央且背景尚未到最右端時，背景往左移動
      characterX = centerX;
      backgroundCameraX = min(maxCameraX, backgroundCameraX + moveSpeed);
    } else {
      // 3. 背景已到最右端，背景捲動暫停，角色 1 往右移動（不超出右邊界）
      characterX = min(width - halfCharWidth, characterX + moveSpeed);
    }
  } else if (pressingLeft && !pressingRight) {
    // 按下往左鍵：
    // 1. 若角色原本在畫面右半邊（從最右端往回走），先讓角色走回畫面中央
    if (characterX > centerX) {
      characterX = max(centerX, characterX - moveSpeed);
    } else if (backgroundCameraX > 0) {
      // 2. 角色在中央且背景尚未到最左端時，背景往右移動
      characterX = centerX;
      backgroundCameraX = max(0, backgroundCameraX - moveSpeed);
    } else {
      // 3. 背景已到最左端，背景捲動暫停，角色 1 往左移動（不超出左邊界）
      characterX = max(halfCharWidth, characterX - moveSpeed);
    }
  }

  // 在左右兩側各複製一張相同大小的背景圖，共 3 張無縫串接
  if (bgLoaded && bgImage && bgImage.width > 0) {
    for (let i = 0; i < 3; i++) {
      const drawX = i * tileWidth - backgroundCameraX;
      image(bgImage, drawX, 0, tileWidth, height);
    }
  }

  // 每隔 frameDuration（100ms）切換一次角色 1 靜止動畫影格
  if (millis() - lastFrameTime >= frameDuration) {
    lastFrameTime = millis();
    stopFrame = (stopFrame + 1) % stopFrameCount;
  }

  // 確保角色 X 座標永遠落在合法畫面範圍內
  characterX = constrain(characterX, halfCharWidth, width - halfCharWidth);

  // 在畫布底部繪製角色 1，並裁切對應的精靈圖影格
  if (stopSheet && stopSheet.width > 0) {
    image(
      stopSheet,
      characterX - halfCharWidth,
      height - displayHeight,
      displayWidth,
      displayHeight,
      stopFrame * sourceFrameWidth,
      0,
      sourceFrameWidth,
      stopSheetHeight
    );
  }
}

function windowResized() {
  // 記錄縮放前的最大捲動距離與是否已抵最右端
  const oldTileWidth = getBackgroundTileWidth();
  const oldMaxCameraX = max(0, oldTileWidth * 3 - width);
  const atRightEdge = oldMaxCameraX > 0 && backgroundCameraX >= oldMaxCameraX - 0.5;

  // 調整畫布尺寸至新視窗大小
  resizeCanvas(windowWidth, windowHeight);

  // 重新計算新視窗下的最大捲動距離並修正鏡頭位置
  const newTileWidth = getBackgroundTileWidth();
  const newMaxCameraX = max(0, newTileWidth * 3 - width);

  if (atRightEdge) {
    backgroundCameraX = newMaxCameraX;
  } else {
    backgroundCameraX = constrain(backgroundCameraX, 0, newMaxCameraX);
  }
}