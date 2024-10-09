from django.shortcuts import render
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
from .models import Event

def mainpage(request):
    return render(request, 'main/mainpage.html')

def attendancepage(request):
    return render(request, 'main/attendancepage.html')

def lecturestart(request):
    return render(request, 'main/lecturestart.html')

# def get_events(request):
#     try:
#         events = Event.objects.all()
#         events_data = [{"title": event.title, "start": event.start_date} for event in events]
#         return JsonResponse(events_data, safe=False)
#     except Exception as e:
#         print(f"Error: {str(e)}")
#         return JsonResponse({"status": "error", "message": str(e)}, status=500)

# def add_event(request):
#     if request.method == "POST":
#         try:
#             data = json.loads(request.body)
#             title = data.get("title")
#             date = data.get("date")  # 단일 날짜 필드

#             # Event 객체 생성
#             Event.objects.create(title=title, date=date)
#             return JsonResponse({"status": "success"})
#         except Exception as e:
#             print(f"Error: {str(e)}")
#             return JsonResponse({"status": "error", "message": str(e)}, status=400)
#     return JsonResponse({"status": "error", "message": "Invalid request method"}, status=405)
# GET 요청: 저장된 이벤트를 반환
def get_events(request):
    events = Event.objects.all()
    events_list = [{"title": event.title, "start": event.start.isoformat()} for event in events]
    return JsonResponse(events_list, safe=False)

# POST 요청: 새로운 이벤트 저장
@csrf_exempt
def add_event(request):
    if request.method == "POST":
        data = json.loads(request.body)
        new_event = Event(title=data['title'], start=data['date'])
        new_event.save()
        return JsonResponse({"status": "success"})
    return JsonResponse({"status": "failed"}, status=400)