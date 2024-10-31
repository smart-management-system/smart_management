document.addEventListener("DOMContentLoaded", function () {
  var calendarEl = document.getElementById("calendar");
  var eventModal = new bootstrap.Modal(document.getElementById("eventModal"));

  var calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    headerToolbar: {
      left: "prev",
      center: "title",
      right: "next",
    },
    selectable: true,

    // 서버에서 이벤트 데이터를 GET으로 가져옴
    events: function (fetchInfo, successCallback, failureCallback) {
      fetch("/get_events/")
        .then((response) => response.json())
        .then((data) => {
          // 데이터 가공 후 성공 콜백 호출
          successCallback(
            data.map((event) => ({
              title: event.title,
              start: event.start,
              backgroundColor: "rgb(100, 100, 195)",
              borderColor: "rgb(100, 100, 195)",
            }))
          );

          // 출석 여부가 true일 때 "출석" 이벤트 추가

          const today = new Date(); // 오늘 날짜 가져오기
          const todayString = today.toISOString().split("T")[0]; // YYYY-MM-DD 형식으로 변환
          const attendanceStatus = localStorage.getItem("isAbsence");

          if (attendanceStatus) {
            // isPresent가 정의되어 있는지 확인
            if (attendanceStatus) {
              // "결석" 이벤트 추가
              calendar.addEvent({
                title: "결석❎",
                start: todayString,
                allDay: true,
                backgroundColor: "red", // 색상 설정
                borderColor: "red", // 색상 설정
              });
            } else {
              calendar.addEvent({
                title: "출석✅",
                start: todayString,
                allDay: true,
                backgroundColor: "green", // 색상 설정
                borderColor: "green", // 색상 설정
              });
            }
          } else {
            console.warn("isPresent가 정의되지 않았습니다.");
          }
        })
        .catch((error) => {
          console.error("Error fetching events:", error);
          failureCallback(error);
        });
    },

    select: function (info) {
      document.getElementById("eventTitle").value = "";
      eventModal.show();

      document.getElementById("saveEventBtn").onclick = function () {
        var title = document.getElementById("eventTitle").value;
        if (title) {
          fetch("/add_event/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": csrftoken,
            },
            body: JSON.stringify({
              title: title,
              date: info.startStr, // 선택된 날짜
            }),
          })
            .then((response) => response.json())
            .then((data) => {
              if (data.status === "success") {
                calendar.addEvent({
                  title: title,
                  start: info.startStr,
                  allDay: true,
                  backgroundColor: "rgb(100, 100, 195)",
                  borderColor: "rgb(100, 100, 195)",
                });
                eventModal.hide();
              } else {
                console.error("Error:", data.message);
              }
            })
            .catch((error) => {
              console.error("Error:", error);
            });
        }
      };
    },
  });

  calendar.render(); // 캘린더 렌더링
});
