with open("src/tabs/MapTab.tsx", "r") as f:
    text = f.read()

target_old = """  const handleSimulateAlert = async () => {
    try {
      const r = await fetch('/api/alert', { method: 'POST' });
      const d = await r.json();
      if (d.alert) {
        setActiveAlert({
          cell_id: d.alert.cell_id,
          village: d.alert.village,
          loss_area: d.alert.loss_area_ha,
          risk: d.alert.conversion_risk,
          lat: -8.8475,
          lng: 116.4883
        });
      }
    } catch (e) {
      console.error(e);
    }
  };"""

target_new = """  const handleSimulateAlert = async () => {
    try {
      const r = await fetch('/api/alert', { method: 'POST' });
      const d = await r.json();
      if (d.alert) {
        const [lat, lng] = d.alert.coordinates;
        setActiveAlert({
          cell_id: d.alert.cell_id,
          village: d.alert.village,
          loss_area: d.alert.loss_area_ha,
          risk: d.alert.conversion_risk,
          unit: d.alert.assigned_unit,
          lat: lat,
          lng: lng,
          _triggerKey: Date.now() // Forces map re-pan even if lat/lng are close
        });
      }
    } catch (e) {
      console.error(e);
    }
  };"""

if target_old in text:
    text = text.replace(target_old, target_new)
    with open("src/tabs/MapTab.tsx", "w") as f:
        f.write(text)
    print("MapTab updated successfully!")
else:
    print("Manual check on MapTab required.")
