import mraa  
import time
import datetime
import requests
import json

trig = mraa.Gpio(29)  
echo = mraa.Gpio(26)  
    
trig.dir(mraa.DIR_OUT)  
echo.dir(mraa.DIR_IN)  
      
def distanceUS():  
    tZero = time.time()    
                            
    trig.write(0)  
    time.sleep(0.000004) # in Arduino 2 microseconds, double this value  
    trig.write(1)  
    time.sleep(0.00001) # in Arduino 5 microseconds, double this value
    trig.write(0)  
                                                    
    sig = None  
    nosig = None  
    etUS = None  

    while echo.read() == 0:
        nosig = time.time()  
    while echo.read() == 1:
        sig = time.time()  
    if sig == None or nosig == None:
        return 0
    etUS = sig - nosig
    distance =  etUS * 17150
    
    return distance

led = mraa.Gpio(23)
led.dir(mraa.DIR_OUT)
led.write(0)

prevDist = 0
trueDist = 0
threshold = 15

url = 'http://ec2-34-196-254-78.compute-1.amazonaws.com:4343/api/meters/number/168/update_status'
header = {"Content-Type": "application/x-www-form-urlencoded"}

counter = 0
tosser = 0
mousseTime = 0
puddingTime = 0

while True:
    tosser += 1
    t1 = time.time() * 1000
    distCheck = False
    dist = distanceUS()
    if (round(t1) %100 == 0):
        prevDist = dist
    else: 
        trueDist = dist
    if (prevDist >  0 and trueDist > 0):
        if (trueDist > threshold and prevDist < threshold):
            #this is where we'll put the stuff for it becoming free
            mousseCheck = time.time() * 1000
            if (mousseTime == 0 or mousseCheck > mousseTime + 5000):
                values = {'is_occupied':'false'}
                r = requests.put(url, data = values, headers = header)
                distCheck = True
                print "mousse ", tosser
                mousseTime = time.time() * 1000
        elif (trueDist < threshold and prevDist > threshold):
            #this is where we'll put the stuff for being taken
            pudCheck = time.time() * 1000
            if (puddingTime == 0 or pudCheck > puddingTime + 5000):
                values = {'is_occupied':'true'}
                r = requests.put(url, data = values, headers = header)
                distCheck = True
                print "pudding ", tosser
                puddingTime = time.time() * 1000
    #if (t1 %100 == 0):
    #    if (distCheck):
    #        led.write(1)
    #    else:
    #        led.write(0)
    #every 15 minutes, check how much time is left on the meter
    #if (t1 %100 == 0):
    #    counter+= 1
    #if (counter > 150):
    #    counter = 0
    #if (counter == 150):
        #get current system time
    #    epochUrl = 'http://ec2-52-203-22-58.compute-1.amazonaws.com:4343/api/system_time'
        #epoch = requests.get(epochUrl)
        #container = epoch.content
        #semiColon = int(container.find(":")) + 1
        #terminus = int(container.find("}"))
        #sysTime  = int(container[int(semiColon):int(terminus)])
        #epochTime = datetime.datetime.fromtimestamp(sysTime / 1000)
        #useTime = epochTime.strftime("%b %d, %Y")

        #get time remaining on the meter
        #totalUrl = "http://ec2-52-203-22-58.compute-1.amazonaws.com:4343/api/meters/number/<METER_NUMBER>"
        #totalContent = requests.get(url)
