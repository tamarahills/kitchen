import RPi.GPIO as GPIO
import time

GPIO.setmode(GPIO.BCM)

# Button
GPIO.setup(17, GPIO.IN, pull_up_down=GPIO.PUD_UP)

# LED
GPIO.setup(18, GPIO.OUT)

## Blinks the LED
def Blink(numTimes,speed):
	for i in range(0,numTimes):
		GPIO.output(18,True) ## Switch on pin 18
		time.sleep(speed) ## Wait
		GPIO.output(18,False) ## Switch off pin 18
		time.sleep(speed)

while True:
	input_state = GPIO.input(17)
	if input_state == False:
		print "Triggered"
		Blink(10, 0.2)
		time.sleep(0.2)
