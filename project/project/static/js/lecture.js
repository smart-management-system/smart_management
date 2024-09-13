document
  .getElementsByClassName("Btn_1")[0]
  .addEventListener("click", function () {
    const videoElement = document.querySelector(".video_camera");
    videoElement.style.display = "block";
  });
document
  .getElementsByClassName("Btn_2")[0]
  .addEventListener("click", function () {
    const videoElement = document.querySelector(".video_camera");
    videoElement.style.display = "none";
  });
