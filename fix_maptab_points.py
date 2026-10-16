with open("src/tabs/MapTab.tsx", "r") as f:
    text = f.read()

old_gathering_loop = """    if (showGathering) {
      const hubsList = gatheringData?.features || [
        { type: "Feature", geometry: { type: "Point", coordinates: [116.4883, -8.8475] }, properties: { name: "Bale Mangrove Visitor Center", cat: "ecotourism_center", weight: 1.5 } },
        { type: "Feature", geometry: { type: "Point", coordinates: [116.4678, -8.8350] }, properties: { name: "Pasar Umum Jerowaru", cat: "market", weight: 1.8 } },
        { type: "Feature", geometry: { type: "Point", coordinates: [116.4820, -8.8820] }, properties: { name: "Kantor & Pasar Pemongkong", cat: "community_center", weight: 1.4 } },
        { type: "Feature", geometry: { type: "Point", coordinates: [116.4830, -8.8315] }, properties: { name: "Masjid Jami Pare Mas", cat: "mosque", weight: 1.5 } }
      ];

      hubsList.forEach((f: any) => {
        pointFeatures.push({
          type: 'Feature',
          geometry: f.geometry,
          properties: { ...f.properties, _pointType: 'hub' }
        });
      });
    }"""

new_gathering_loop = """    if (showGathering && gatheringData?.features) {
      gatheringData.features.forEach((f: any) => {
        const [lng, lat] = f.geometry.coordinates;
        // STRICT COASTAL LAND FILTER: Reject points floating in deep bay waters
        const isWaterBody = (lng > 116.492 && lat < -8.842) || (lng < 116.465 && lat < -8.840);
        if (!isWaterBody) {
          pointFeatures.push({
            type: 'Feature',
            geometry: f.geometry,
            properties: { ...f.properties, _pointType: 'hub' }
          });
        }
      });
    }"""

if old_gathering_loop in text:
    text = text.replace(old_gathering_loop, new_gathering_loop)
    with open("src/tabs/MapTab.tsx", "w") as f:
        f.write(text)
    print("src/tabs/MapTab.tsx updated with strict land-only filter!")
else:
    print("Check MapTab manually.")
