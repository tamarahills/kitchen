from SimpleCV import Color, Camera, Display
import requests

def get_product_name(upc_code):
    url = 'http://api.upcdatabase.org/json/010d30eb776907d2acdd9331baf1ba7a/'
    url += upc_code
    r = requests.get(url)
    print(r.status_code)
    print(r.text)

cam = Camera()
display = Display()

while(display.isNotDone()):
 img = cam.getImage()

 barcode = img.findBarcode()

 if(barcode is not None):
   barcode = barcode[0]
   result = str(barcode.data)
   print result
   barcode = []
   get_product_name(result)

 img.save(display)
