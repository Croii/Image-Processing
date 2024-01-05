const canvasId = "canvas";
const imgWidth = 300;
const imgHeight = 300;

// Prewitt operator
async function getFile() {
    try {
        const response = await fetch("https://dog.ceo/api/breeds/image/random");
        if (!response.ok) {
            throw new Error(`Image didn't load correctly. Status: ${response.status}`);
        }

        const data = await response.json();
        drawImage(data.message);
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

function drawImageOnCanvas(img, pozX, pozY) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext("2d");
    img.onload = () => {
        ctx.drawImage(img, pozX, pozY, imgWidth, imgHeight);

        const start = Date.now();

        transform(ctx, img);

        const end = Date.now();
        console.log(`Execution time: ${end - start} ms`);
    };

}

function drawImage(imageSrc) {
    const img = createImage(imageSrc);
    drawImageOnCanvas(img, 0, 0);
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

async function transform(ctx, img) {
    const imageData = ctx.getImageData(0, 0, imgWidth, imgHeight);
    const data = imageData.data;

    let matrixRGBA = Array.from({ length: imgWidth }, () =>
        Array.from({ length: imgHeight }, () => new rgba())
    );

    let maskGy = [[1, 1, 1], [0, 0, 0], [-1, -1, -1]];
    let maskGx = [[1, 0, -1], [1, 0, -1], [1, 0, -1]];

    let srcImageRGBA = convertArrayToRGBAMatrix(data);

    let transformedImageMatrixGx = await matrixConvolution(maskGx, srcImageRGBA);
    let transformedImageMatrixGy = await matrixConvolution(maskGy, srcImageRGBA);
    let transformedImageMatrixG = computeGradient(transformedImageMatrixGx, transformedImageMatrixGy);

    let transformedImageArray = MatrixRGBAToArray(transformedImageMatrixG);
    let transformedImageData = new ImageData(Uint8ClampedArray.from(transformedImageArray), 298, 298);

    ctx.putImageData(transformedImageData, 300, 0);
}

function matrixConvolution(mask, inputMatrix) {


    const M = inputMatrix.length;
    const N = inputMatrix[0].length;
    const P = mask.length;
    const Q = mask[0].length;


    let outputMatrix = Array.from({ length: inputMatrix.length - mask.length + 1 }, () =>
        Array.from({ length: inputMatrix[0].length - mask[0].length + 1 }, () => new rgba()));




    for (let i = 0; i < M - P + 1; i++) {
        for (let j = 0; j < N - Q + 1; j++) {
            let sum = new rgba();
            sum.alpha = 255;
            for (let k = 0; k < P; k++) {
                for (let l = 0; l < Q; l++) {
                    sum.red += inputMatrix[i + k][j + l].red * mask[k][l];
                    sum.green += inputMatrix[i + k][j + l].green * mask[k][l];
                    sum.blue += inputMatrix[i + k][j + l].blue * mask[k][l];

                }
            }
            outputMatrix[i][j] = sum;
        }
    }
    return outputMatrix;
}

getFile();
