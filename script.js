const originalCanvasId = "canvas";
const modifiedCanvasId = "modified-canvas";
const imgWidth = 300;
const imgHeight = 300;

// Prewitt operator
async function getFile() {
    try {
        const startTimeFetch = Date.now(); // Start recording fetch execution time

        const response = await fetch("https://dog.ceo/api/breeds/image/random");
        if (!response.ok) {
            throw new Error(`Image didn't load correctly. Status: ${response.status}`);
        }
        const data = await response.json();
        // console.log(data);
        displayJsonContent(data);
        const endTimeFetch = Date.now(); // Stop recording fetch execution time

        console.log(`Fetching JSON took ${endTimeFetch - startTimeFetch} ms`);

        // Draw image on canvas and apply processing
        drawImage(data.message);

        // Stop recording image processing execution time
    } catch (error) {
        console.error(error.message);
    }
}

function createImage(imageSrc) {
    const img = new Image(imgWidth, imgHeight);
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    return img;
}


function displayJsonContent(jsonData) {
    const jsonContainer = document.getElementById('json-container');
    jsonContainer.innerHTML = `
        <h2>JSON Content:</h2>
        <pre>${JSON.stringify(jsonData, null, 2)}</pre>
    `;
}


function drawImage(imageSrc) {
    const img = createImage(imageSrc);
    drawImageOnCanvas(img, originalCanvasId, 0, 0);
}


function drawImageOnCanvas(img, canvasId, pozX, pozY) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext("2d");
    img.onload = () => {
        ctx.drawImage(img, pozX, pozY, imgWidth, imgHeight);

        const start = Date.now();
        if (canvasId === originalCanvasId) {
            // If it's the original canvas, perform processing
            transform(ctx, img);
        }
        const end = Date.now();
        console.log(`Execution time: ${end - start} ms`);
    };
}
class rgba {
    constructor() {
        this.red = 0;
        this.green = 0;
        this.blue = 0;
        this.alpha = 0;
    }
}

function convertArrayToRGBAMatrix(arr) {
    let matrixRGBA = Array.from({ length: imgWidth }, () =>
        Array.from({ length: imgHeight }, () => new rgba())
    );

    let k = 0;
    for (let i = 0; i < imgWidth; i++)
        for (let j = 0; j < imgHeight; j++) {
            matrixRGBA[i][j].red = arr[k];
            matrixRGBA[i][j].green = arr[k + 1];
            matrixRGBA[i][j].blue = arr[k + 2];
            matrixRGBA[i][j].alpha = arr[k + 3];
            k += 4;
        }
    return matrixRGBA;
}


function computeGradient(Gx, Gy) {
    let G = Array.from({ length: Gx.length }, () =>
        Array.from({ length: Gx[0].length }, () => new rgba())
    );

    for (let i = 0; i < Gx.length; i++)
        for (let j = 0; j < Gy.length; j++) {
            G[i][j].red = Math.sqrt(Gx[i][j].red * Gx[i][j].red + Gy[i][j].red * Gy[i][j].red);
            G[i][j].green = Math.sqrt(Gx[i][j].green * Gx[i][j].green + Gy[i][j].green * Gy[i][j].green);
            G[i][j].blue = Math.sqrt(Gx[i][j].blue * Gx[i][j].blue + Gy[i][j].blue * Gy[i][j].blue);
            G[i][j].alpha = 255;
        }
    return G;
}

function MatrixRGBAToArray(matrixRGBA) {
    let transformedImageArray = [];
    for (let i = 0; i < matrixRGBA.length; i++)
        for (let j = 0; j < matrixRGBA[0].length; j++) {
            transformedImageArray.push(matrixRGBA[i][j].red);
            transformedImageArray.push(matrixRGBA[i][j].green);
            transformedImageArray.push(matrixRGBA[i][j].blue);
            transformedImageArray.push(matrixRGBA[i][j].alpha);
        }
    return transformedImageArray;
}


function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}



async function transform(ctx, img) {
    const startTimeTransform = Date.now();

    const imageData = ctx.getImageData(0, 0, imgWidth, imgHeight);
    const data = imageData.data;

    await delay(1000);
    console.log("Step 1 completed");

    let matrixRGBA = Array.from({ length: imgWidth }, () =>
        Array.from({ length: imgHeight }, () => new rgba())
    );

    let maskGy = [[1, 1, 1], [0, 0, 0], [-1, -1, -1]];
    let maskGx = [[1, 0, -1], [1, 0, -1], [1, 0, -1]];

    let srcImageRGBA = convertArrayToRGBAMatrix(data);

    const [transformedImageMatrixGx, transformedImageMatrixGy] = await Promise.all([
        matrixConvolution(maskGx, srcImageRGBA),
        matrixConvolution(maskGy, srcImageRGBA)
    ]);
    await delay(1000);
    console.log("Step 2 completed");

    // Now that the first two lines have completed, proceed with the third line
    let transformedImageMatrixG = computeGradient(transformedImageMatrixGx, transformedImageMatrixGy);
    await delay(1000);
    console.log("Step 3 completed");

    mirrorEffect(transformedImageMatrixG);
    let transformedImageArray = MatrixRGBAToArray(transformedImageMatrixG);

    // let transformedImageData = new ImageData(Uint8ClampedArray.from(transformedImageArray), 298, 298);
    const transformedImageData = new ImageData(Uint8ClampedArray.from(transformedImageArray), imgWidth, imgHeight);

    const endTimeTransform = Date.now(); // Stop recording transform execution time
    await delay(1000);
    console.log("Step 4 completed");
    console.log(`Transform execution time: ${endTimeTransform - startTimeTransform} ms`);

    const modifiedCanvas = document.getElementById(modifiedCanvasId);
    const modifiedCtx = modifiedCanvas.getContext("2d");

    // Clear the canvas before drawing
    modifiedCtx.clearRect(0, 0, imgWidth, imgHeight);
    modifiedCtx.putImageData(transformedImageData, 0, 0);
}

function mirrorEffect(matrixRGBA) {
    for (let i = 0; i < matrixRGBA.length; i++) {
        for (let j = 0; j < matrixRGBA[0].length / 2; j++) {
            // Swap pixels vertically
            const temp = matrixRGBA[i][j];
            matrixRGBA[i][j] = matrixRGBA[i][matrixRGBA.length - 1 - j];
            matrixRGBA[i][matrixRGBA.length - 1 - j] = temp;
        }
    }
}

function matrixConvolution(mask, inputMatrix) {
    const M = inputMatrix.length;
    const N = inputMatrix[0].length;
    const P = mask.length;
    const Q = mask[0].length;

    let outputMatrix = Array.from({ length: M }, () =>
        Array.from({ length: N }, () => new rgba()));

    for (let i = 0; i < M; i++) {
        for (let j = 0; j < N; j++) {
            let sum = new rgba();
            sum.alpha = 255;
            for (let k = 0; k < P; k++) {
                for (let l = 0; l < Q; l++) {
                    const rowIdx = i - Math.floor(P / 2) + k;
                    const colIdx = j - Math.floor(Q / 2) + l;

                    if (rowIdx >= 0 && rowIdx < M && colIdx >= 0 && colIdx < N) {
                        sum.red += inputMatrix[rowIdx][colIdx].red * mask[k][l];
                        sum.green += inputMatrix[rowIdx][colIdx].green * mask[k][l];
                        sum.blue += inputMatrix[rowIdx][colIdx].blue * mask[k][l];
                    }
                }
            }
            outputMatrix[i][j] = sum;
        }
    }
    return outputMatrix;
}


getFile();
