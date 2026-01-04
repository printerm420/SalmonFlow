# Salmon River Flow & Alerts - MVP Spec

## Quick Reference
- **USGS Site**: `04250200` (Salmon River at Pulaski, NY)
- **API**: `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=04250200&parameterCd=00060,00010`
- **Weather Zip**: `13142`
- **Dam Schedule**: `https://safewaters.com/facility/lighthouse-hill`

---

## Design System (USE THESE EXACT VALUES)

### Colors
```
Background:        #121212
Card/Surface:      #1E1E1E
Card Border:       #2D2D2D
Text Primary:      #FFFFFF
Text Secondary:    #9CA3AF
Text Muted:        #6B7280

Zone Colors:
- LOW (0-350 CFS):        #3B82F6 (Blue)
- PRIME (350-750 CFS):    #10B981 (Green)
- CAUTION (750-1200 CFS): #F59E0B (Orange)
- BLOWN OUT (1200+ CFS):  #EF4444 (Red)
```

### Typography
- Hero CFS Number: 72px, bold, white
- Status Label: 28px, bold, zone color
- Card Values: 24px, bold
- Card Labels: 12px, gray
- Body: 16px

### Spacing
- Screen padding: 20px horizontal
- Card padding: 16px
- Card border-radius: 16px
- Gap between elements: 16px

---

## Tab 1: Status (Home) - PRIORITY

### Layout (top to bottom)
1. **Header Row**
   - Left: "Salmon River" title (24px, white, bold)
   - Right: Settings gear icon (optional)

2. **Hero Gauge** (takes 50% of screen)
   - Full circle gauge with colored segments
   - Segments: Blue (0-350) → Green (350-750) → Orange (750-1200) → Red (1200-2000)
   - White needle pointing to current value
   - Center: Large CFS number (72px) + "CFS" label below
   - Below gauge: Status text "PRIME" in zone color (28px)

3. **Info Cards Row** (2 cards, side by side)
   - Card 1: Water Temp
     - Icon: thermometer
     - Value: "48°F" (24px bold)
     - Label: "Water Temp" (12px gray)
   - Card 2: 24hr Trend
     - Icon: trending up/down
     - Value: "+12%" (24px bold, green if up, red if down)
     - Label: "24hr Trend" (12px gray)

4. **Update Indicator**
   - Small text: "● Updated just now • USGS 04250200"
   - Gray text, centered, 12px
   - Green dot if fresh, yellow if stale (>30min)

### Gauge Technical Spec
- Use `react-native-svg`
- Full 360° circle, but only show top 270° (like a speedometer)
- Arc stroke width: 24px
- 4 colored segments proportional to CFS ranges
- Needle: White triangle, rotates based on CFS value
- Needle rotation: 0 CFS = -135°, 2000 CFS = +135° (270° total range)
- Center text overlay positioned absolutely

### Mock Data (for now)
```javascript
const MOCK_DATA = {
  currentCFS: 542,
  waterTempF: 48,
  trend24hr: 12, // percentage, positive = up
  lastUpdated: new Date(),
  status: 'PRIME' // calculated from CFS
};
```

---

## Tab 2: Trends

### Layout
1. **Header**
   - Title: "7-Day Trend" (24px)
   - Current value badge: "542 CFS ↑12%"

2. **Line Chart** (60% of screen)
   - 7 data points (one per day)
   - X-axis: Day names (Mon, Tue, etc.)
   - Y-axis: CFS values (auto-scale)
   - Line color: Green (#10B981)
   - Show horizontal dashed line at 750 CFS labeled "PRIME ZONE"
   - Tap point to show tooltip with exact value

3. **Stats Cards** (2x2 grid below chart)
   - Avg Flow: "482 CFS"
   - Peak Flow: "892 CFS"
   - Lowest Flow: "310 CFS"
   - Days in Prime: "5 DAYS"

### Mock Data
```javascript
const MOCK_TREND = [
  { day: 'Mon', cfs: 420 },
  { day: 'Tue', cfs: 380 },
  { day: 'Wed', cfs: 520 },
  { day: 'Thu', cfs: 680 },
  { day: 'Fri', cfs: 590 },
  { day: 'Sat', cfs: 542 },
  { day: 'Sun', cfs: 510 },
];
```

---

## Tab 3: Forecast

### Layout
1. **Current Weather Card** (top)
   - Large temp: "74°" (48px)
   - Icon: weather condition
   - "Partly Cloudy" text
   - "Feels like 78°F"
   - Row: High/Low, Precip %, Wind, Daylight hours

2. **7-Day Forecast** (horizontal scroll)
   - Cards for each day
   - Day name, icon, high/low temps, rain %

3. **Dam Release Schedule** (bottom 40%)
   - Header: "Dam Release Schedule" + "SafeWaters.com" link
   - WebView loading `https://safewaters.com/facility/lighthouse-hill`
   - Show loading spinner while loading

### Mock Weather Data
```javascript
const MOCK_WEATHER = {
  current: { temp: 74, condition: 'Partly Cloudy', feelsLike: 78 },
  today: { high: 82, low: 68, precip: 15, wind: '8 mph SE' },
  forecast: [
    { day: 'Today', high: 82, low: 68, precip: 15, icon: 'sun' },
    { day: 'Mon', high: 76, low: 62, precip: 80, icon: 'rain' },
    // ... etc
  ]
};
```

---

## Tab 4: Settings

### Layout (simple for MVP)
1. **Alerts Section**
   - Toggle: "Notify when flow enters PRIME zone"
   - When toggled ON → show simple "Premium required" modal
   - Just a placeholder for now

2. **About Section**
   - App version
   - "Data from USGS"
   - "Weather from OpenWeatherMap"

---

## File Structure
```
app/
  (tabs)/
    _layout.tsx    # Tab navigation
    index.tsx      # Status/Home
    trends.tsx     # Trends
    forecast.tsx   # Forecast
    settings.tsx   # Settings
components/
  FlowGauge.tsx    # The circular gauge
  StatCard.tsx     # Reusable stat card
  WeatherCard.tsx  # Weather display
```

---

## Implementation Order
1. Status page (gauge + cards) - DESIGN ONLY with mock data
2. Trends page (chart + stats) - DESIGN ONLY with mock data
3. Forecast page (weather + webview) - DESIGN ONLY with mock data
4. Settings page (simple toggles)
5. THEN add real API calls

---

## What NOT to Build (MVP Cuts)
- ❌ User authentication
- ❌ Multiple rivers
- ❌ Pan/zoom on charts
- ❌ 14-day or 30-day views
- ❌ Complex paywall
- ❌ Push notifications (just UI for now)
- ❌ Offline caching
- ❌ Tablet layouts
