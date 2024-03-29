// Constants
const originalCanvasId = "canvas";
const modifiedCanvasId = "modified-canvas";
const imgWidth = 300;
const imgHeight = 300;

// Fetch image and start processing
getFile();

// Fetch image from the Dog API
async function getFile() {
    try {
        const startTimeFetch = Date.now();
        const response = await fetch("https://dog.ceo/api/breeds/image/random");

        if (!response.ok) {
            throw new Error(`Image didn't load correctly. Status: ${response.status}`);
        }

        const data = await response.json();
        displayJsonContent(data);
        const endTimeFetch = Date.now();

        console.log(`Fetching JSON took ${endTimeFetch - startTimeFetch} ms`);

        // Draw image on canvas and initiate processing
        drawImage(data.message);
    } catch (error) {
        console.error(error.message);
    }
}

// Create an image element
function createImage(imageSrc) {
    const img = new Image(imgWidth, imgHeight);
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    return img;
}

// Display JSON content in the HTML
function displayJsonContent(jsonData) {
    const jsonContainer = document.getElementById('json-container');
    jsonContainer.innerHTML = `
        <h2>JSON Content:</h2>
        <pre>${JSON.stringify(jsonData, null, 2)}</pre>
    `;
}

// Draw image on canvas
function drawImage(imageSrc) {
    const img = createImage(imageSrc);
    drawImageOnCanvas(img, originalCanvasId, 0, 0);
}

// Draw image on specified canvas
function drawImageOnCanvas(img, canvasId, posX, posY) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext("2d");

    img.onload = () => {
        ctx.drawImage(img, posX, posY, imgWidth, imgHeight);

        // Record the start time for processing
        const start = Date.now();

        if (canvasId === originalCanvasId) {
            // If it's the original canvas, perform processing
            transform(ctx, img);
        }

        // Record the end time and log the execution time
        const end = Date.now();
        console.log(`Execution time: ${end - start} ms`);
    };
}

// RGBA class for handling pixel data
class RGBA {
    constructor() {
        this.red = 0;
        this.green = 0;
        this.blue = 0;
        this.alpha = 0;
    }
}

// Convert flat array to RGBA matrix
function convertArrayToRGBAMatrix(arr) {
    let matrixRGBA = Array.from({ length: imgWidth }, () =>
        Array.from({ length: imgHeight }, () => new RGBA())
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

// Compute gradient using Prewitt operator
function computeGradient(Gx, Gy) {
    let G = Array.from({ length: Gx.length }, () =>
        Array.from({ length: Gx[0].length }, () => new RGBA())
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

// Convert RGBA matrix to flat array
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

// Delay function for asynchronous operations
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Image processing function
async function transform(ctx, img) {
    let startTimeTransform = Date.now();

    const imageData = ctx.getImageData(0, 0, imgWidth, imgHeight);
    const data = imageData.data;

    console.log("Step 1 completed");
    document.getElementById("step1-time").innerHTML = "Step 1 Execution Time: " + (Date.now() - startTimeTransform) + " ms";
    await delay(1000);
    startTimeTransform = Date.now();

    let matrixRGBA = Array.from({ length: imgWidth }, () =>
        Array.from({ length: imgHeight }, () => new RGBA())
    );

    let maskGy = [[1, 1, 1], [0, 0, 0], [-1, -1, -1]];
    let maskGx = [[1, 0, -1], [1, 0, -1], [1, 0, -1]];

    let srcImageRGBA = convertArrayToRGBAMatrix(data);

    const [transformedImageMatrixGx, transformedImageMatrixGy] = await Promise.all([
        matrixConvolution(maskGx, srcImageRGBA),
        matrixConvolution(maskGy, srcImageRGBA)
    ]);
    console.log("Step 2 completed");
    document.getElementById("step2-time").innerHTML = "Step 2 Execution Time: " + (Date.now() - startTimeTransform) + " ms";
    await delay(1000);
    startTimeTransform = Date.now();

    // Now that the first two lines have completed, proceed with the third line
    let transformedImageMatrixG = computeGradient(transformedImageMatrixGx, transformedImageMatrixGy);
    console.log("Step 3 completed");
    document.getElementById("step3-time").innerHTML = "Step 3 Execution Time: " + (Date.now() - startTimeTransform) + " ms";
    await delay(1000);
    startTimeTransform = Date.now();

    mirrorEffect(transformedImageMatrixG);
    let transformedImageArray = MatrixRGBAToArray(transformedImageMatrixG);

    const transformedImageData = new ImageData(Uint8ClampedArray.from(transformedImageArray), imgWidth, imgHeight);

    const modifiedCanvas = document.getElementById(modifiedCanvasId);
    const modifiedCtx = modifiedCanvas.getContext("2d");

    // Clear the canvas before drawing
    document.getElementById("step4-time").innerHTML = "Step 4 Execution Time: " + (Date.now() - startTimeTransform) + " ms";
    console.log("Step 4 completed");
    await delay(1000);
    modifiedCtx.clearRect(0, 0, imgWidth, imgHeight);
    modifiedCtx.putImageData(transformedImageData, 0, 0);
}

// Apply mirroring effect to RGBA matrix
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

// Convolution operation for image processing
function matrixConvolution(mask, inputMatrix) {
    const M = inputMatrix.length;
    const N = inputMatrix[0].length;
    const P = mask.length;
    const Q = mask[0].length;

    let outputMatrix = Array.from({ length: M }, () =>
        Array.from({ length: N }, () => new RGBA())
    );

    for (let i = 0; i < M; i++) {
        for (let j = 0; j < N; j++) {
            let sum = new RGBA();
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
