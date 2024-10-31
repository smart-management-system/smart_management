document.addEventListener("DOMContentLoaded", function () {
  const videoElement = document.getElementById("videoElement");
  const statusElement = document.getElementById("status");
  const DrowsinessElement = document.getElementById("Drowsiness");
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");

  let camera = null;
  let faceMesh = null;
  let blinkCount = 0;
  let userDetected = false;
  let isEyeClosed = false;
  let headDownDetected = false;
  let eyesclosedDetected = 0;
  let timerInterval = null;
  let drowsinessCheckInterval = null;
  let lastDetectedTime = 0;
  let isDrowsinessAlertActive = false;
  let alertSound;
  alertSound = document.getElementById("alertSound");
  let alertTimer; // 타이머를 전역 변수로 선언
  let alertStartTime = 0; // 누적 시간을 저장할 변수
  let alertSoundPlayed = false; // 알람 상태 변수
  let isAbsence = false;
  function playAlertSound() {
    if (alertSound && !alertSoundPlayed) {
      alertSound.currentTime = 0;
      alertSound
        .play()
        .then(() => {
          alertSoundPlayed = true; // 알람 재생 상태 업데이트

          // 알람이 울리는 동안 시간 누적을 위한 interval 설정
          alertTimer = setInterval(() => {
            alertStartTime += 1; // 누적 시간 증가
          }, 1000); // 1초마다 alertStartTime 증가

          // 알람 종료 시 interval 해제
          alertSound.onended = () => {
            clearInterval(alertTimer); // 타이머 정지
            alertTimer = null; // 타이머 변수 초기화
            console.log(`알람음 재생 완료 시간: ${alertStartTime}초`);
          };
        })
        .catch((error) => {
          console.error("알람 소리 재생 중 오류 발생:", error);
        });
    }
  }

  // 알람음 off 함수
  function pauseAlertSound() {
    if (alertSound && alertSoundPlayed) {
      alertSound.pause();
      alertSound.currentTime = 0; // 알람 소리 초기화
      alertSoundPlayed = false; // 알람 재생 상태 초기화
      clearInterval(alertTimer); // 타이머 정지
      alertTimer = null; // 타이머 변수 초기화
      console.log(`알람음이 멈췄습니다. 누적 시간: ${alertStartTime}초`);
    }
  }

  // 사용자 인식 함수
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
      DrowsinessElement.innerText = "";
      if (!userDetected) {
        userDetected = true;
        pauseAlertSound(); // 사용자 다시 인식 시 알람 끄기
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

      detectDrowsiness(ear);

      // 고개 떨어졌을 경우 (코와 턱 위치 기반)
      const nose = faceLandmarks[1];
      const chin = faceLandmarks[152];

      const headTiltAngle = calculateHeadTilt(nose, chin);

      if (headTiltAngle > 93) {
        if (!headDownDetected) {
          headDownDetected = true;
          console.log("고개가 떨어졌습니다.");
          DrowsinessElement.innerText = "수업에 집중해주세요!";
          playAlertSound();
        }
      } else {
        if (headDownDetected) {
          headDownDetected = false;
          DrowsinessElement.innerText = "";
          pauseAlertSound();
        }
      }
    } else {
      // 얼굴이 인식되지 않을 경우
      if (camera && userDetected) {
        userDetected = false;
        DrowsinessElement.innerText = "수업에 집중해주세요!";
        playAlertSound(); // 사용자가 사라지면 알람 울리기
      }
    }
  }

  //눈 7초이상 감고 있을 경우
  function detectDrowsiness(ear) {
    const currentTime = Date.now();

    if (ear < 0.2) {
      // 눈이 감긴 상태일 때
      if (currentTime - lastDetectedTime >= 1000) {
        eyesclosedDetected++;
        lastDetectedTime = currentTime;
        console.log("eyesclosedDetected:", eyesclosedDetected);
      }

      // 눈을 7초 이상 감고 있으면 알람 재생
      if (eyesclosedDetected >= 7 && !isDrowsinessAlertActive) {
        console.log("7초이상 눈을 감고 있었음.");
        DrowsinessElement.innerText = "수업에 집중해주세요!";
        playAlertSound();
        console.log("알람이 재생되었습니다.");
        isDrowsinessAlertActive = true;
      }

      isEyeClosed = true; // 눈이 감겨있는 상태 설정
    } else {
      // 눈을 뜬 상태일 때
      if (isEyeClosed) {
        blinkCount++;
        statusElement.innerText = `눈 깜박임 수: ${blinkCount}`;
        isEyeClosed = false;
      }
      if (isDrowsinessAlertActive) {
        isDrowsinessAlertActive = false;
        eyesclosedDetected = 0;
        DrowsinessElement.innerText = "";
        pauseAlertSound();
      }
      isEyeClosed = false;
    }
  }

  function calculateHeadTilt(nose, chin) {
    const dx = chin.x - nose.x;
    const dy = chin.y - nose.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    return Math.abs(angle);
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
  //  사용자 눈깜박임 보류

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

  // 모달 표시 함수
  function showAbsenceModal() {
    const modal = document.getElementById("absenceModal");
    const closeModalBtn = document.getElementById("closeModalBtn");

    if (modal) {
      console.log("모달이 표시됩니다."); // 디버그용
      modal.style.display = "flex"; // flex로 설정하여 중앙 정렬 가능
    } else {
      console.error("모달 요소를 찾을 수 없습니다.");
    }

    // 모달 닫기 버튼 클릭 시 모달 숨김
    closeModalBtn.onclick = function () {
      modal.style.display = "none";
    };

    // 모달 외부 클릭 시 모달 숨김
    window.onclick = function (event) {
      if (event.target === modal) {
        modal.style.display = "none";
      }
    };
  }
  function showAbsenceModal(isAbsent) {
    const modal = document.getElementById("absenceModal");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const absenceIcon = document.getElementById("absenceIcon");
    const isAbsenceText = document.getElementById("isAbsence");

    if (modal) {
      console.log("모달이 표시됩니다."); // 디버그용
      modal.style.display = "flex"; // flex로 설정하여 중앙 정렬 가능

      // 상태에 따라 아이콘과 메시지 변경
      if (isAbsent) {
        absenceIcon.src = XIconUrl; // 결석 아이콘
        isAbsenceText.innerText = "결석입니다."; // 결석 메시지
      } else {
        absenceIcon.src = checkIconUrl; // 출석 아이콘
        isAbsenceText.innerText = "출석입니다."; // 출석 메시지
      }
    } else {
      console.error("모달 요소를 찾을 수 없습니다.");
    }

    // 모달 닫기 버튼 클릭 시 모달 숨김
    closeModalBtn.onclick = function () {
      modal.style.display = "none";
    };

    // 모달 외부 클릭 시 모달 숨김
    window.onclick = function (event) {
      if (event.target === modal) {
        modal.style.display = "none";
      }
    };
  }

  // 수업 종료 버튼 이벤트 리스너 추가
  // stopBtn 클릭 이벤트 리스너 수정
  stopBtn.addEventListener("click", function () {
    // 10초 이상 경고음이 울렸을 때 모달 표시
    console.log("alertStartTime:", alertStartTime);
    isAbsence = alertStartTime >= 10; // 결석 상태 결정
    showAbsenceModal(isAbsence);

    // 기존 stop 기능 유지
    if (camera) {
      clearInterval(timerInterval);
      clearInterval(drowsinessCheckInterval);
      camera.stop();
      camera = null;
      videoElement.style.display = "none";
    }

    // 출석 상태를 캘린더로 전송
    localStorage.setItem("isAbsence", isAbsence);
  });
});
