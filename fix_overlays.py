import ee
import requests

ee.Initialize(project='semai-hackathon')

center = ee.Geometry.Point([116.4883, -8.8475])
aoi = center.buffer(5500).bounds()

emb = ee.ImageCollection('GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL')
def get_emb(y):
    return emb.filterDate(f'{y}-01-01', f'{y+1}-01-01').filterBounds(aoi).mosaic().clip(aoi)

# Re-train lightweight classifier
from ee import Feature, FeatureCollection
pts = [
    Feature(ee.Geometry.Point([116.4885, -8.8480]), {'class': 0}), # Mangrove
    Feature(ee.Geometry.Point([116.4750, -8.8400]), {'class': 1}), # Pond
    Feature(ee.Geometry.Point([116.5000, -8.8600]), {'class': 2}), # Water
    Feature(ee.Geometry.Point([116.4678, -8.8350]), {'class': 3}), # Built
    Feature(ee.Geometry.Point([116.4500, -8.8500]), {'class': 4})  # Other
]
training = FeatureCollection(pts).map(lambda f: f.buffer(50))
img24 = get_emb(2024)
samples = img24.sampleRegions(collection=training, properties=['class'], scale=10)
clf = ee.Classifier.smileRandomForest(50).train(samples, 'class', img24.bandNames())

print("Regenerating transparent PNG overlays...")
# Only show Mangrove (0) and Pond (1), masking out 'Other' and deep water for clean map display
pal = ['1b7837', 'f59e0b'] # Mangrove green, Pond amber

for y in range(2017, 2025):
    classified = get_emb(y).classify(clf).focalMode(1)
    # Mask: only pixels that are Mangrove (0) or Pond (1)
    mask = classified.eq(0).Or(classified.eq(1))
    
    # Visualize only mangrove & pond with full transparency on everything else
    vis = classified.updateMask(mask).visualize(min=0, max=1, palette=pal)
    
    thumb_url = vis.getThumbURL({
        'region': aoi,
        'dimensions': 1024,
        'format': 'png',
        'crs': 'EPSG:3857'
    })
    res = requests.get(thumb_url)
    with open(f'lc_{y}.png', 'wb') as f:
        f.write(res.content)
    print(f"lc_{y}.png generated with transparent background.")

# Upload fixed transparent PNGs to Cloud Storage
import os
os.system("gcloud storage cp lc_*.png gs://semai-data-hrs/data/")
print("Upload complete!")
