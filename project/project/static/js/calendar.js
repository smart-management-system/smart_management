document.addEventListener("DOMContentLoaded", function () {
  var calendarEl = document.getElementById("calendar");

  var calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth", // 월별 보기
    initialDate: "2024-09-01", // 시작 날짜
    headerToolbar: {
      // 상단 버튼들
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay",
    },
    events: [
      // 미리 설정한 이벤트 (출석 여부, 일정 등)
      {
        title: "출석 O",
        start: "2024-09-03",
      },
      {
        title: "출석 X",
        start: "2024-09-04",
      },
    ],
    dateClick: function (info) {
      // 날짜 클릭 시 이벤트 핸들러
      var eventTitle = prompt("Enter Event Title:");
      if (eventTitle) {
        calendar.addEvent({
          title: eventTitle, // 사용자가 입력한 제목
          start: info.dateStr, // 클릭한 날짜
        });
      }
    },
  });

  calendar.render();
});
