with open("src/tabs/MapTab.tsx", "r") as f:
    content = f.read()

# Replace handleSimulateAlert to read dynamic server coordinates
old_handle = """  const handleSimulateAlert = async () => {
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

new_handle = """  const handleSimulateAlert = async () => {
    try {
      const r = await fetch('/api/alert', { method: 'POST' });
      const d = await r.json();
      if (d.alert) {
        const [lat, lng] = d.alert.coordinates || [-8.8475, 116.4883];
        setActiveAlert({
          cell_id: d.alert.cell_id,
          village: d.alert.village,
          loss_area: d.alert.loss_area_ha,
          risk: d.alert.conversion_risk,
          unit: d.alert.assigned_unit,
          lat: lat,
          lng: lng
        });
      }
    } catch (e) {
      console.error(e);
    }
  };"""

if old_handle in content:
    content = content.replace(old_handle, new_handle)
    with open("src/tabs/MapTab.tsx", "w") as f:
        f.write(content)
    print("src/tabs/MapTab.tsx updated with dynamic coordinate panning!")
else:
    print("Could not find exact text, check MapTab manually.")
