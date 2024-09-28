document.addEventListener("DOMContentLoaded", function () {
  const videoElement = document.getElementById("videoElement");
  const statusElement = document.getElementById("status");
  const DrowsinessElement = document.getElementById("Drowsiness");
  const checkcoment = document.getElementById("checkcoment");
  const timerElement = document.getElementById("timer");
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");

  let camera = null;
  let faceMesh = null;
  let blinkCount = 0;
  let isEyeClosed = false;
  let averageBlinkCount = 0;
  let drowsinessDetected = false;
  let headDownStartTime = 0;
  let headDownDetected = false;
  let alertSoundPlayed = false;
  let timerInterval = null;
  let drowsinessCheckInterval = null;

  function playAlertSound() {
    const alertSound = document.getElementById("alertSound");
    alertSound.currentTime = 0; // 소리 처음부터 재생
    alertSound.play();
    alertSoundPlayed = true;
  }

  async function setupFaceMesh() {
    const { FaceMesh } = window;
    faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1, // 추적 가능한 사용자 얼굴 갯수
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults(onResults);
  }

  function onResults(results) {
    if (results.multiFaceLandmarks.length > 0) {
      // 얼굴이 인식되면 "수업에 집중해주세요!" 텍스트 숨기기
      DrowsinessElement.innerText = "";
      const alertSound = document.getElementById("alertSound");

      if (alertSoundPlayed) {
        alertSound.pause();
        alertSound.currentTime = 0; // 소리 위치를 처음으로 리셋
        alertSoundPlayed = false; // 상태 초기화
      }
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
          statusElement.innerText = `눈 깜박임 수: ${blinkCount}`;
        }
      } else {
        isEyeClosed = false;
      }

      // 고개 떨어짐 감지 (코와 턱 위치 기반)
      const nose = faceLandmarks[1]; // 코 좌표
      const chin = faceLandmarks[152]; // 턱 좌표

      const headTiltAngle = calculateHeadTilt(nose, chin);
      console.log(`Head Tilt Angle: ${headTiltAngle}`);
      if (headTiltAngle > 93) {
        if (!headDownDetected) {
          headDownStartTime = Date.now();
          headDownDetected = true;
          console.log("고개가 떨어졌습니다."); // 고개가 처음 떨어졌을 때
          DrowsinessElement.innerText = "수업에 집중해주세요!";
          if (!alertSoundPlayed) {
            playAlertSound();
          }
        }
      } else {
        // 고개가 다시 정상 범위로 돌아왔을 때
        if (headDownDetected) {
          headDownStartTime = 0;
          headDownDetected = false; // 상태를 초기화
          DrowsinessElement.innerText = "";
          console.log("고개가 올라와 경고 문구를 숨깁니다.");
          alertSoundPlayed = false;
        }
      }
    } else {
      // 얼굴이 인식되지 않을 때 메시지 표시
      if (camera) {
        DrowsinessElement.innerText = "수업에 집중해주세요!";
        if (!alertSoundPlayed) {
          // 알람이 아직 재생되지 않았다면 재생
          playAlertSound();
          alertSoundPlayed = true; // 알람이 재생되었음을 기록
        }
      }
    }
  }

  function calculateHeadTilt(nose, chin) {
    const dx = chin.x - nose.x;
    const dy = chin.y - nose.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    return Math.abs(angle); // 각도를 절댓값으로 계산
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

  function startTimer() {
    let timeLeft = 20;
    timerElement.innerText = `타이머: ${timeLeft}초`;

    timerInterval = setInterval(() => {
      timeLeft--;
      timerElement.innerText = `타이머: ${timeLeft}초`;

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        timerElement.style.display = "none"; // 타이머 끝나면 텍스트 숨기기
        averageBlinkCount = blinkCount / 20;
        statusElement.innerText = `20초 동안의 평균 눈 깜박임 수: ${averageBlinkCount}`;
        blinkCount = 0;

        // 기준 눈 깜박임 수 체크가 끝나자마자 Drowsiness 함수 호출
        checkDrowsiness();
        checkcoment.innerText = "졸음 체크 중..."; // 졸음 체크 후에도 다시 상태 표시

        drowsinessCheckInterval = setInterval(() => {
          checkDrowsiness();
        }, 20000); // 매 20초마다 졸음 체크
      }
    }, 1000);
  }

  function checkDrowsiness() {
    console.log("checkDrowsiness 함수가 실행되었습니다.");

    statusElement.innerText = `현재 눈 깜박임 수: ${blinkCount}`;

    if (blinkCount < averageBlinkCount * 0.7) {
      DrowsinessElement.innerText = "졸음 감지!";

      setTimeout(() => {
        DrowsinessElement.innerText = "";
      }, 1000);
    } else {
      DrowsinessElement.innerText = "";
    }

    blinkCount = 0; // 깜박임 수 초기화
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
        startTimer();
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
      statusElement.innerText = "수업이 종료되었습니다";
      checkcoment.innerText = "";
      clearInterval(timerInterval);
      clearInterval(drowsinessCheckInterval);
      timerElement.innerText = "";
      DrowsinessElement.innerText = "";
    }
  });
});
