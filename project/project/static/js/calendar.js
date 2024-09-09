document.addEventListener("DOMContentLoaded", function () {
  var calendarEl = document.getElementById("calendar");
  var eventModal = new bootstrap.Modal(document.getElementById("eventModal")); // 모달 객체를 여기서 생성

  var calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    headerToolbar: {
      left: "prev",
      center: "title",
      right: "next",
    },
    selectable: true,

    events: function (fetchInfo, successCallback, failureCallback) {
      fetch("/get_events/")
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((data) => {
          successCallback(
            data.map((event) => ({
              title: event.title,
              start: event.start,
              color: "#ff0000", // 일정 색상 설정
            }))
          );
        })
        .catch((error) => {
          console.error("Error fetching events:", error);
          failureCallback(error);
        });
    },
    select: function (info) {
      // 모달 창에서 선택한 날짜를 표시
      document.getElementById("eventTitle").value = "";
      eventModal.show();

      // 저장 버튼 클릭 시 일정 추가
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
              date: info.startStr, // 단일 날짜 사용
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
                eventModal.hide(); // 모달 창 닫기
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

  calendar.render();
});
