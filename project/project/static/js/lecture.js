document.addEventListener("DOMContentLoaded", function () {
  const videoElement = document.getElementById("videoElement");
  const statusElement = document.getElementById("status");
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");

  let camera = null;
  let faceMesh = null;
  let blinkCount = 0;
  let isEyeClosed = false;
  let drowsinessDetected = false;

  async function setupFaceMesh() {
    const { FaceMesh } = window;
    faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults(onResults);
  }

  function onResults(results) {
    if (results.multiFaceLandmarks.length > 0) {
      const faceLandmarks = results.multiFaceLandmarks[0];
      const leftEyeLandmarks = [
        faceLandmarks[33],
        faceLandmarks[160],
        faceLandmarks[158],
        faceLandmarks[133],
        faceLandmarks[153],
        faceLandmarks[144],
      ];
      const rightEyeLandmarks = [
        faceLandmarks[362],
        faceLandmarks[385],
        faceLandmarks[387],
        faceLandmarks[263],
        faceLandmarks[373],
        faceLandmarks[380],
      ];

      const leftEar = calculateEyeAspectRatio(leftEyeLandmarks);
      const rightEar = calculateEyeAspectRatio(rightEyeLandmarks);
      const ear = (leftEar + rightEar) / 2.0;

      if (ear < 0.2) {
        if (!isEyeClosed) {
          blinkCount++;
          isEyeClosed = true;
        }
      } else {
        isEyeClosed = false;
      }

      if (blinkCount <= 5) {
        statusElement.innerText = `Normal - Blinks: ${blinkCount}`;
      } else {
        drowsinessDetected = true;
        statusElement.innerText = `Drowsiness Detected - Blinks: ${blinkCount}`;
      }
    }
  }

  function calculateEyeAspectRatio(eyeLandmarks) {
    const A = Math.sqrt(
      Math.pow(eyeLandmarks[1].x - eyeLandmarks[5].x, 2) +
        Math.pow(eyeLandmarks[1].y - eyeLandmarks[5].y, 2)
    );
    const B = Math.sqrt(
      Math.pow(eyeLandmarks[2].x - eyeLandmarks[4].x, 2) +
        Math.pow(eyeLandmarks[2].y - eyeLandmarks[4].y, 2)
    );
    const C = Math.sqrt(
      Math.pow(eyeLandmarks[0].x - eyeLandmarks[3].x, 2) +
        Math.pow(eyeLandmarks[0].y - eyeLandmarks[3].y, 2)
    );
    return (A + B) / (2.0 * C);
  }

  startBtn.addEventListener("click", async function () {
    if (!camera) {
      await setupFaceMesh();
      const { Camera } = window;
      if (Camera) {
        camera = new Camera(videoElement, {
          onFrame: async () => {
            await faceMesh.send({ image: videoElement });
          },
          width: 640,
          height: 480,
        });
        camera.start();
        videoElement.style.display = "block"; // Start 버튼 클릭 시 비디오 요소 보이기
      } else {
        console.error("Camera class is not available.");
      }
    }
  });

  stopBtn.addEventListener("click", function () {
    if (camera) {
      camera.stop();
      camera = null;
      videoElement.style.display = "none"; // Stop 버튼 클릭 시 비디오 요소 숨기기
      statusElement.innerText = "Stopped";
    }
  });
});
