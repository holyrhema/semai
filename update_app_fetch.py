with open("src/App.tsx", "r") as f:
    text = f.read()

# Add cache-busting timestamp to gathering.geojson
text = text.replace(
    "fetch(`${baseUrl}gathering.geojson`)",
    "fetch(`${baseUrl}gathering.geojson?v=2`)"
)

with open("src/App.tsx", "w") as f:
    f.write(text)

print("App.tsx updated with fresh gathering points fetch!")
