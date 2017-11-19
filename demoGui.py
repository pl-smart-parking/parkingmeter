from Tkinter import *
import tkFont
import time
import datetime
import requests
import json
#import qrcode

master = Tk()
midHead = tkFont.Font(family='Helvetica', size=36, weight="bold")
easel = Canvas(master, width = 960, height = 1080)
easel.pack()

#make the background
easel.create_rectangle(960, 1080, 0, 0, fill = "white")

#make the top section
totalUrl = "http://ec2-34-196-254-78.compute-1.amazonaws.com:4343/api/meters/number/168"
totalData = requests.get(totalUrl)
totalContent = totalData.content
frags = totalContent.split(":")
length = len(frags)
frags = frags[1:]
newList = ['primer']
for f in frags:
    splitter = f.split(",")
    newList = newList + [''+splitter[0]+'']
print(newList)
meterID = newList[1]
occupied = newList[2]
endTime = newList[3]
startTime = newList[4]
rate = newList[5]
latitude = newList[6]
longitude = newList[7]
meterNum = newList[8]

easel.create_rectangle(960, 265, 0, 270, fill = "black")

topText = "#", meterNum
headerFont = tkFont.Font(family = "Helvetica", size=64, weight="bold")
topLeft = easel.create_text(25, 80, text = topText, anchor = "nw", font = headerFont)

#make availability square
bgColor = "white"
if (occupied == 1):
    bgColor = "red"
else:
    bgColor = "green"
topRight = easel.create_rectangle(700, 0, 960, 270, fill = bgColor)
#get mid left ection
epochUrl = "http://ec2-34-196-254-78.compute-1.amazonaws.com:4343/api/system_time"
epoch = requests.get(epochUrl)
container = epoch.content
semiColon = int(container.find(":")) + 1
terminus = int(container.find("}"))
sysTime = int(container[int(semiColon):int(terminus)])
epochTime = datetime.datetime.fromtimestamp(sysTime/1000)
useTime = epochTime.strftime("%b %d, %Y")
print(useTime)

easel.create_rectangle(478, 270, 482, 1080, fill = "black")
reVal = ""
if (int(endTime) <= int(sysTime)):
    reVal = "00:00"
else:
    diff = int(endTime) - int(sysTime)
    diffTime = datetime.datetime.fromtimestamp(diff)
    reVal = diffTime.strftime("%H:%M")
remainingStr = "Remaining: \n" + reVal
midLeft = easel.create_text(25, 420, text = remainingStr, anchor = "nw", font = midHead)
#get bottom left section
elVal = ""
if (int(sysTime) >= int(endTime)):
    elVal = "00:00"
else:
    diff = int(sysTime) - int(startTime)
    diffTime = datetime.datetime.fromtimestamp(diff)
    elVal = diffTime.strftime("%H:%M")
elapsedStr = "Elapsed: \n" + elVal
botLeft = easel.create_text(25, 775, text = elapsedStr, anchor = "nw", font = midHead)
easel.create_rectangle(0, 658, 478, 662, fill = "black")

#now for theqr code
#qr = qrcode.QRCode(
#    version=1,
#    error_correction=qrcode.constants.ERROR_CORRECT_L,
#    box_size=10,
#    border=4)
#qr.add_data('')
#qr.make(fit=true)
#img = qr.make_image()
#append to canvas
#easel.create_image(700, 700, image=img, anchor="nw")
timer = 0
count = 0
while True:
    curTime = round(time.time() * 1000)
    if (curTime > timer + 5000):
        count+= 1
        timer = round(time.time()*1000)
        totalData = requests.get(totalUrl)
        totalContent = totalData.content
        frags = totalContent.split(":")
        length = len(frags)
        frags = frags[1:]
        newList = ['primer']
        for f in frags:
            splitter = f.split(",")
            newList = newList + [''+splitter[0]+'']
        meterID = newList[1]
        print(meterID)
        occupied = newList[2]
        print(occupied)
        endTime = newList[3]
        print(endTime)
        startTime = newList[4]
        print(startTime)
        rate = newList[5]
        print(rate)
        latitude = newList[6]
        print(latitude)
        longitude = newList[7]
        print(longitude)
        meterNum = newList[8]
        print(meterNum)

        print(newList)
        print(count)

        topText = "#", meterNum

        reVal = ""
        if (int(endTime) <= int(sysTime)):
            reVal = "00:00"
        else:
            diff = int(endTime) - int(sysTime)
            diffTime = datetime.datetime.fromtimestamp(diff)
            reVal = diffTime.strftime("%H:%M")
        remainingStr = "Remaining: \n" + reVal
        elVal = ""
        if (int(sysTime) >= int(endTime)):
            elVal = "00:00"
        else:
            diff = int(sysTime) - int(startTime)
            diffTime = datetime.datetime.fromtimestamp(diff)
            elVal = diffTime.strftime("%H:%M")
        elapsedStr = "Elapsed: \n" + elVal
        if (count == 3):
            elapsedStr = "Hey there"
        if (occupied == 0):
            easel.itemconfig(topRight, fill="green")
        else:
            easel.itemconfig(topRight, fill="red")
        easel.itemconfig(topLeft, text=topText)
        easel.itemconfig(midLeft, text=remainingStr)
        easel.itemconfig(botLeft, text=elapsedStr)
    master.update_idletasks()
    master.update()

