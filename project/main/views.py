from django.shortcuts import render

# Create your views here.
def mainpage(request):
    return render(request,'main/mainpage.html')

def attendancepage(request):
    return render(request,'main/attendancepage.html')

def lecturestart(request):
    return render(request,'main/lecturestart.html')
