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
          successCallback(
            data.map((event) => ({
              title: event.title,
              start: event.start,
              backgroundColor: "rgb(100, 100, 195)",
              borderColor: "rgb(100, 100, 195)",
            }))
          );
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

  calendar.render();
});
