from SimpleCV import Color, Camera, Display
import json
from os.path import join, dirname
from os import environ
from watson_developer_cloud import VisualRecognitionV3

visual_recognition = VisualRecognitionV3('2016-05-20', api_key='30a8e58eb3163f8319ebea84ecd1b1b0027b6038')

cam = Camera()
img = cam.getImage()
img.save("/home/pi/tamara/snap.jpg")


with open(join(dirname(__file__), './snap.jpg'), 'rb') as image_file:
    print(json.dumps(visual_recognition.classify(images_file=image_file, classifier_ids=['greenpepper_194357852', 'orange_2010321797', 'banana_760231312', 'default']), indent=2))
