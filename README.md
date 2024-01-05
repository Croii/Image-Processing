# Image Processing App

## Overview

This is an Image Processing App that fetches a random dog image from the Dog API, performs a series of image processing steps, and displays the original and modified images on two separate canvases. The application is implemented using HTML, CSS, and JavaScript.

## Features

- **Random Image Fetching**: The app fetches a random dog image from the Dog API using an asynchronous fetch operation.

- **Image Processing Steps**:
  1. **Step 1**: Display the fetched image on the original canvas.
  2. **Step 2**: Apply convolution operations using Prewitt masks for gradient computation.
  3. **Step 3**: Compute the gradient using the Prewitt operator.
  4. **Step 4**: Apply a mirroring effect to the modified image.

- **Execution Time Tracking**: The application tracks the execution time for each processing step and displays it in the HTML.

## Implementation

### File Structure

- `index.html`: HTML file with the structure of the application.
- `style.css`: CSS file for styling the HTML elements.
- `script.js`: JavaScript file containing the logic and image processing algorithms.

### Modules

- **Image Fetching Module**: Responsible for fetching a random dog image from the Dog API.
- **Image Drawing Module**: Draws the fetched image on the original canvas.
- **Image Processing Module**: Contains functions for image processing, including convolution and gradient computation.
- **Mirror Effect Module**: Implements the mirroring effect on the modified image.
- **Execution Time Tracking Module**: Tracks and displays the execution time for each processing step.

### How to Run

1. Open `index.html` in a web browser.

## Bibliography

- Dog API: [https://dog.ceo/dog-api/](https://dog.ceo/dog-api/)
- Prewitt Operator: [https://en.wikipedia.org/wiki/Prewitt_operator](https://en.wikipedia.org/wiki/Prewitt_operator)
