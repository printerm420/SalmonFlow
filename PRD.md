# Product Requirements Document (PRD)
## Salmon River Flow & Alerts

**Version:** 1.0  
**Date:** 2024  
**Product Manager:** Product Team  
**Lead Architect:** Engineering Team  

---

## 1. App Overview

### 1.1 Product Name
**Salmon River Flow & Alerts**

### 1.2 Primary Goal
Provide "Glanceable" real-time water data for two distinct user scenarios:
- **Wade Fishermen**: Anglers standing in the water who need instant, high-contrast information at a glance
- **Trip Planners**: Anglers sitting on the couch who need comprehensive data to make informed decisions about whether to drive to the river

### 1.3 Core Value Proposition
**"Insurance" against wasted gas money and bad fishing trips.**

The app serves as a critical decision-making tool that prevents anglers from:
- Driving long distances to find unfavorable fishing conditions
- Wasting time and fuel on trips that won't yield good results
- Missing optimal fishing windows due to lack of timely information
- Making uninformed decisions that lead to poor fishing experiences

### 1.4 Target Market
- **Primary Market**: Anglers in and around Pulaski, NY
- **Secondary Market**: Anglers planning trips to the Salmon River from surrounding areas
- **User Base**: Both recreational and serious anglers who value data-driven fishing decisions

### 1.5 Success Metrics
- User retention rate (daily active users)
- Alert engagement rate (users who act on notifications)
- User satisfaction scores
- Reduction in "bad trip" reports
- Premium subscription conversion rate

---

## 2. User Personas

### 2.1 Persona 1: "The River Guy"
**Demographics:**
- Age: 30-60
- Experience: Experienced angler, frequent visitor to Salmon River
- Location: Local or frequent visitor to Pulaski, NY
- Device Usage: Primarily mobile, often outdoors

**Pain Points:**
- Needs to check conditions while already at or near the river
- Often checking in early morning or low-light conditions
- Needs instant "Go/No-Go" decision making
- May have wet hands or be wearing gloves
- Battery conservation is important (outdoors, limited charging)

**Needs & Requirements:**
- **Big, high-contrast text**: Must be readable in bright sunlight and low-light conditions
- **Dark mode (forced)**: Essential for early morning checks (4-6 AM) to avoid eye strain
- **Instant "Go/No-Go" gauge**: Visual indicator that requires zero interpretation
- **Minimal interaction**: Should get all critical info in < 3 seconds
- **Large touch targets**: Minimum 44px height for fat fingers, especially when wearing gloves
- **Offline capability**: Should cache last known data for when cell service is poor

**Usage Patterns:**
- Quick checks before leaving home
- On-the-river condition verification
- Multiple checks throughout the day
- Prefers visual indicators over text-heavy interfaces

**Key Features Priority:**
1. Hero gauge (Status tab) - CRITICAL
2. Large, readable numbers
3. Color-coded status indicators
4. Fast loading times

---

### 2.2 Persona 2: "The Couch Guy"
**Demographics:**
- Age: 25-55
- Experience: Moderate to experienced angler
- Location: Lives 30+ minutes from Pulaski, NY
- Device Usage: Primarily mobile, often at home or office

**Pain Points:**
- Needs to decide if a 1-3 hour drive is worth it
- Wants to plan trips in advance (days ahead)
- Needs historical context to understand current conditions
- Wants to avoid wasted trips due to poor conditions
- Needs alerts to catch optimal conditions without constant checking

**Needs & Requirements:**
- **7-day trend history**: Visual representation of flow patterns over time
- **Alerts system**: Notifications when conditions become optimal or dangerous
- **Forecast information**: Weather and dam release schedules
- **Contextual data**: Temperature, historical comparisons
- **Trip planning tools**: Ability to set custom thresholds for alerts
- **Detailed information**: More data than "The River Guy" needs

**Usage Patterns:**
- Evening planning sessions (checking next day conditions)
- Weekend trip planning (checking 2-3 days ahead)
- Alert-driven engagement (opens app when notified)
- Longer session times (5-10 minutes per use)

**Key Features Priority:**
1. Trends chart - CRITICAL
2. Alert system - CRITICAL
3. Forecast tab - HIGH
4. Historical comparisons - MEDIUM

---

## 3. Tech Stack

### 3.1 Frontend Framework
**React Native with Expo SDK 50+**
- **Rationale**: Cross-platform development, rapid iteration, excellent community support
- **Version**: Expo SDK 50 or higher
- **Benefits**: 
  - Single codebase for iOS and Android
  - Over-the-air updates capability
  - Rich ecosystem of pre-built components
  - Simplified build and deployment process

### 3.2 Navigation
**Expo Router (File-based routing)**
- **Rationale**: Type-safe, file-based routing that integrates seamlessly with Expo
- **Implementation**: 
  - File-based routing structure (`app/` directory)
  - Deep linking support
  - Tab navigation for main app sections
  - Modal presentation for alerts and settings
- **Structure**:
  ```
  app/
    (tabs)/
      index.tsx          # Status/Home tab
      trends.tsx         # Trends tab
      forecast.tsx       # Forecast tab
      settings.tsx       # Settings/Alerts tab
    _layout.tsx          # Root layout
  ```

### 3.3 Styling
**NativeWind (Tailwind CSS) + Lucide Icons**
- **NativeWind**: 
  - Tailwind CSS utility classes for React Native
  - Consistent design system
  - Rapid UI development
  - Dark mode support built-in
- **Lucide Icons**:
  - Comprehensive icon library
  - Consistent visual language
  - Lightweight and performant
  - React Native compatible

### 3.4 State Management
**Zustand or React Context**
- **Zustand** (Preferred):
  - Lightweight state management
  - Simple API
  - Good TypeScript support
  - Minimal boilerplate
  - Perfect for app-level state (flow data, user preferences, alert settings)
- **React Context** (Fallback):
  - Built-in React solution
  - No additional dependencies
  - Suitable for simpler state needs

**State Structure:**
- Flow data (current, historical)
- Temperature data
- User preferences (alert thresholds, units)
- Authentication state
- Subscription status

### 3.5 Backend Services

#### 3.5.1 Firebase
**Purpose**: Authentication and Push Notifications

**Firebase Authentication:**
- Email/password authentication
- Anonymous authentication (for free tier users)
- User profile management
- Secure token management

**Firebase Cloud Messaging (FCM):**
- Push notification delivery
- Background notification handling
- Notification scheduling
- User-specific notification targeting

**Firebase Firestore (Optional):**
- User preferences storage
- Alert configuration storage
- Analytics data collection

#### 3.5.2 Monetization
**Superwall or RevenueCat**

**Superwall** (Preferred):
- Advanced paywall presentation
- A/B testing capabilities
- Analytics and conversion tracking
- Seamless integration with Firebase

**RevenueCat** (Alternative):
- Cross-platform subscription management
- Receipt validation
- Subscription status management
- Analytics dashboard

**Monetization Strategy:**
- Free tier: Basic flow data, limited alerts
- Premium tier: Unlimited alerts, advanced features, ad-free experience
- Paywall triggers: When user attempts to set up alerts

### 3.6 Data Sources

#### 3.6.1 USGS Water Services API
**Endpoint**: `https://waterservices.usgs.gov/nwis/iv/`
**Site ID**: `04250200` (Salmon River at Pulaski, NY)
**Parameters**:
- `00060`: Discharge/Flow (CFS - Cubic Feet per Second)
- `00010`: Temperature (Celsius)

**API Call Example**:
```
GET https://waterservices.usgs.gov/nwis/iv/?format=json&sites=04250200&parameterCd=00060,00010&siteStatus=all
```

**Data Refresh Rate**:
- Real-time: Every 15 minutes
- Background fetch: Every hour when app is in background
- Cache: Last known values stored locally for offline access

#### 3.6.2 OpenWeatherMap API
**Purpose**: Weather forecast for Pulaski, NY
**Location**: Zip Code `13142`
**Data Points**:
- Current temperature
- 7-day forecast
- Precipitation probability
- Wind conditions
- Cloud cover

**API Endpoint**: OpenWeatherMap One Call API 3.0

#### 3.6.3 SafeWaters.com
**Purpose**: Dam release schedules
**URL**: `https://safewaters.com/facility/lighthouse-hill`
**Implementation**: WebView integration
**Rationale**: Official source for dam release information, maintained by facility operators

### 3.7 Additional Libraries

#### 3.7.1 Charting
**Options**:
- `react-native-gifted-charts`: Lightweight, performant, good for line charts
- `victory-native`: More features, larger bundle size, excellent customization

**Recommendation**: `react-native-gifted-charts` for performance and bundle size

#### 3.7.2 SVG/Animations
**Options**:
- `react-native-svg`: For custom gauge rendering
- `react-native-reanimated`: For smooth gauge animations

**Implementation**: Use both libraries for optimal gauge performance

#### 3.7.3 WebView
**Library**: `react-native-webview` (Expo managed)
**Purpose**: Display SafeWaters.com dam release schedules

#### 3.7.4 Date/Time
**Library**: `date-fns` or `dayjs`
**Purpose**: Date formatting, time calculations, relative time displays

---

## 4. Detailed Feature Requirements

### 4.1 Tab 1: Status (Home)

#### 4.1.1 Overview
The Status tab is the primary entry point and most critical screen. It provides instant, glanceable information about current river conditions with a focus on visual communication over text.

#### 4.1.2 Hero UI: Semi-Circle Speedometer Gauge

**Visual Design:**
- **Shape**: Semi-circle (180-degree arc) speedometer-style gauge
- **Size**: Takes up 60-70% of screen height on initial view
- **Position**: Centered horizontally, positioned in upper 2/3 of screen
- **Background**: Dark mode compatible (#121212 base)

**Gauge Components:**
1. **Arc/Needle**:
   - Animated needle that moves based on current flow value
   - Smooth animation when data updates (using `react-native-reanimated`)
   - Needle color matches current status zone

2. **Color Zones** (from left to right):
   - **0-350 CFS**: LOW (Blue)
     - Hex: `#3B82F6` (Blue-500)
     - Meaning: Water too low, difficult fishing conditions
   - **350-750 CFS**: PRIME (Neon Green)
     - Hex: `#10B981` (Emerald-500) or `#00FF00` (Neon Green)
     - Meaning: Optimal fishing conditions
   - **750-1200 CFS**: CAUTION (Yellow/Orange)
     - Hex: `#F59E0B` (Amber-500) transitioning to `#F97316` (Orange-500)
     - Meaning: Fishable but challenging, requires caution
   - **1200+ CFS**: BLOWN OUT (Red)
     - Hex: `#EF4444` (Red-500)
     - Meaning: Dangerous conditions, not recommended

3. **Labels**:
   - Zone labels positioned along the arc
   - Large, high-contrast text (minimum 18pt font)
   - White or light gray text on dark background
   - Zone boundaries clearly marked (350, 750, 1200)

4. **Current Value Display**:
   - **Large numeric display**: Current CFS value
   - **Font size**: 72-96pt (extremely large for glanceability)
   - **Font weight**: Bold
   - **Color**: Matches current zone color
   - **Position**: Center of gauge arc
   - **Label**: "CFS" in smaller text below number

5. **Status Text**:
   - Current status word (LOW, PRIME, CAUTION, BLOWN OUT)
   - Font size: 32-40pt
   - Color: Matches zone color
   - Position: Below the numeric value

**Technical Implementation:**
- Use `react-native-svg` for gauge rendering
- Use `react-native-reanimated` for smooth needle animations
- Gauge should be responsive to different screen sizes
- Animation duration: 800ms-1000ms for smooth transitions

#### 4.1.3 Additional Status Information

**Below the Gauge:**

1. **Temperature Display**:
   - Water temperature in large, readable format
   - Format: "XX°F" or "XX°C" (user preference)
   - Font size: 24-28pt
   - Icon: Temperature icon from Lucide
   - Position: Below gauge, centered or left-aligned

2. **Last Updated Timestamp**:
   - Format: "Updated X minutes ago" or "Updated at HH:MM AM/PM"
   - Font size: 14-16pt
   - Color: Gray (#9CA3AF)
   - Position: Below temperature

3. **Refresh Indicator**:
   - Pull-to-refresh capability
   - Manual refresh button (optional, for "River Guy" quick access)
   - Loading state: Subtle spinner or skeleton screen

#### 4.1.4 Data Logic

**Flow Status Calculation:**
```typescript
function getFlowStatus(cfs: number): FlowStatus {
  if (cfs < 350) return { zone: 'LOW', color: '#3B82F6', label: 'LOW' };
  if (cfs >= 350 && cfs < 750) return { zone: 'PRIME', color: '#10B981', label: 'PRIME' };
  if (cfs >= 750 && cfs < 1200) return { zone: 'CAUTION', color: '#F59E0B', label: 'CAUTION' };
  if (cfs >= 1200) return { zone: 'BLOWN_OUT', color: '#EF4444', label: 'BLOWN OUT' };
}
```

**Gauge Needle Position Calculation:**
```typescript
function calculateNeedleAngle(cfs: number): number {
  // Gauge range: 0-2000 CFS (0-180 degrees)
  const maxCFS = 2000;
  const angle = (cfs / maxCFS) * 180;
  return Math.min(180, Math.max(0, angle));
}
```

**Data Fetching:**
- **Primary Source**: USGS API Site `04250200`
- **Parameters**: 
  - `00060`: Discharge/Flow (CFS)
  - `00010`: Temperature (Celsius, convert to Fahrenheit for display)
- **Refresh Rate**: 
  - On app open: Immediate fetch
  - Background: Every 15 minutes
  - Manual: Pull-to-refresh or refresh button
- **Error Handling**:
  - Display last known value with "stale data" indicator
  - Show error message if fetch fails
  - Retry logic with exponential backoff

**Data Caching:**
- Store last successful fetch in local storage
- Display cached data immediately on app open
- Update with fresh data when available
- Cache expiration: 1 hour (mark as stale after)

#### 4.1.5 User Interactions

1. **Pull-to-Refresh**: Standard React Native pull-to-refresh gesture
2. **Tap Gauge**: (Optional) Show detailed information modal
3. **Long Press**: (Optional) Share current conditions

#### 4.1.6 Accessibility

- Screen reader support: Announce current flow and status
- High contrast mode support
- Dynamic type support (respects system font size settings)
- VoiceOver/TalkBack labels for all interactive elements

---

### 4.2 Tab 2: Trends

#### 4.2.1 Overview
The Trends tab provides historical context through a 7-day line chart, helping users understand flow patterns and make informed decisions about future trips.

#### 4.2.2 UI Components

**7-Day Line Chart:**
- **Library**: `react-native-gifted-charts` or `victory-native`
- **Chart Type**: Line chart with area fill (optional)
- **Orientation**: Landscape (horizontal)
- **Size**: Takes up 70-80% of screen height

**Chart Elements:**

1. **Y-Axis (Flow - CFS)**:
   - Range: Auto-scaling based on 7-day data range
   - Minimum: 0 CFS
   - Maximum: Highest value in dataset + 10% padding
   - Labels: Every 200-500 CFS (depending on range)
   - Font size: 12-14pt
   - Color: Light gray (#D1D5DB)
   - Grid lines: Subtle horizontal lines for readability

2. **X-Axis (Days)**:
   - 7 data points (one per day)
   - Labels: Day abbreviations (Mon, Tue, Wed, etc.) or dates (MM/DD)
   - Font size: 12-14pt
   - Color: Light gray (#D1D5DB)
   - Grid lines: Subtle vertical lines (optional)

3. **Data Line**:
   - Color: Matches current status zone color OR gradient
   - Line width: 3-4px
   - Smooth curves: Use bezier curves for aesthetic appeal
   - Data points: Visible dots at each data point
   - Point size: 6-8px radius
   - Point color: Same as line or white with colored border

4. **Area Fill** (Optional):
   - Gradient fill under the line
   - Opacity: 20-30%
   - Colors: Gradient from zone colors

5. **Zone Indicators**:
   - Horizontal reference lines at 350, 750, 1200 CFS
   - Dashed lines in zone colors
   - Labels: "PRIME ZONE", "CAUTION ZONE", etc.
   - Subtle, non-intrusive

**Current Value Highlight:**
- Vertical line at current/latest data point
- Highlighted data point (larger, different color)
- Current value displayed prominently

#### 4.2.3 Data Points

**Data Collection:**
- **Source**: USGS API historical data
- **Frequency**: Daily average or hourly snapshots (depending on API availability)
- **Time Range**: Last 7 days (168 hours)
- **Data Points**: Minimum 7 points (one per day), ideally 24-168 points (hourly)

**Data Processing:**
- Calculate daily averages if using hourly data
- Handle missing data points (interpolation or gap indication)
- Sort chronologically (oldest to newest)

**Data Display:**
- Show exact values on interaction (see below)
- Tooltip/popup on tap showing:
  - Date and time
  - Exact CFS value
  - Temperature (if available)
  - Status zone at that time

#### 4.2.4 User Interactions

1. **Tap Data Point**:
   - Show tooltip/popup with detailed information
   - Highlight selected point
   - Display: Date, Time, CFS, Temperature, Status
   - Dismiss: Tap outside or close button

2. **Pan/Zoom** (Optional, Advanced):
   - Allow horizontal panning to see more detail
   - Pinch-to-zoom for closer inspection
   - Reset button to return to default view

3. **Time Range Selector** (Optional):
   - Toggle between 7-day, 14-day, 30-day views
   - Buttons or segmented control

#### 4.2.5 Additional Information

**Below the Chart:**

1. **Statistics Panel**:
   - **Average Flow**: 7-day average CFS
   - **Peak Flow**: Highest value in 7 days
   - **Lowest Flow**: Lowest value in 7 days
   - **Days in Prime**: Count of days with flow between 350-750 CFS
   - Display in card format with icons

2. **Trend Indicator**:
   - Arrow up/down with percentage change
   - "Flow is X% higher/lower than 7-day average"
   - Color-coded (green for favorable, red for unfavorable)

3. **Comparison Text**:
   - "Compared to yesterday: +X CFS"
   - "Compared to last week: +X CFS"

#### 4.2.6 Data Fetching

**API Endpoint**: USGS Water Services API
**Parameters**:
- Site: `04250200`
- Parameter: `00060` (Flow)
- Period: Last 7 days (`period=P7D`)
- Format: JSON

**Caching Strategy**:
- Cache 7-day dataset locally
- Refresh every hour
- Show cached data immediately, update in background

**Error Handling**:
- Display cached data if available
- Show error message if fetch fails
- Retry with exponential backoff

---

### 4.3 Tab 3: Forecast

#### 4.3.1 Overview
The Forecast tab combines weather information and dam release schedules to help users plan future trips with comprehensive environmental context.

#### 4.3.2 Layout Structure

**Two-Section Layout:**
1. **Top Section (60%)**: Weather Widget
2. **Bottom Section (40%)**: Dam Release Schedule (WebView)

**Divider**: Subtle separator between sections

#### 4.3.3 Weather Widget (Top Section)

**Data Source**: OpenWeatherMap API
**Location**: Zip Code `13142` (Pulaski, NY)
**API Type**: One Call API 3.0 or Current + Forecast API

**Display Components:**

1. **Current Weather** (Top of Section):
   - **Temperature**: Large display (48-56pt font)
   - **Condition**: Weather icon (from OpenWeatherMap or custom)
   - **Description**: "Partly Cloudy", "Sunny", etc. (16-18pt font)
   - **Feels Like**: "Feels like XX°F" (14pt font)
   - Layout: Horizontal, centered

2. **Today's Forecast**:
   - **High/Low**: "H: XX° L: XX°"
   - **Precipitation**: "X% chance of rain"
   - **Wind**: "X mph from [direction]"
   - **Sunrise/Sunset**: Icon + time
   - Layout: Card format with icons

3. **7-Day Forecast** (Scrollable Horizontal List):
   - **Day**: Day name (Mon, Tue, etc.)
   - **Icon**: Weather condition icon
   - **High/Low**: Temperature range
   - **Precipitation**: Rain probability
   - **Layout**: Horizontal scrollable cards
   - **Card Size**: Minimum 100px width, 120px height

**Visual Design:**
- Dark mode compatible
- High contrast text
- Icons from Lucide or OpenWeatherMap
- Card-based layout with subtle borders
- Spacing: 16px padding between elements

**Data Refresh:**
- Refresh every 30 minutes
- Cache for offline viewing
- Show last updated timestamp

#### 4.3.4 Dam Release Schedule (Bottom Section)

**Implementation**: WebView
**URL**: `https://safewaters.com/facility/lighthouse-hill`
**Library**: `react-native-webview` (Expo managed)

**WebView Configuration:**
- **Height**: 40% of screen height (minimum 300px)
- **Width**: Full width
- **Scrolling**: Enabled (vertical and horizontal if needed)
- **Zoom**: Disabled (to prevent layout issues)
- **JavaScript**: Enabled (required for site functionality)
- **Cache**: Enabled for offline access

**UI Enhancements:**
1. **Header**:
   - Title: "Dam Release Schedule"
   - Subtitle: "Source: SafeWaters.com"
   - Refresh button (reloads WebView)
   - Loading indicator

2. **Loading State**:
   - Skeleton screen or spinner
   - "Loading schedule..." text

3. **Error Handling**:
   - Error message if WebView fails to load
   - Retry button
   - Fallback: Link to open in external browser

4. **Navigation** (Optional):
   - Back/Forward buttons if user navigates within WebView
   - Home button to return to original URL

**User Experience:**
- Smooth scrolling within WebView
- Touch interactions work naturally
- External links: Open in external browser (user choice)
- Long press: Context menu (copy, share, etc.)

**Accessibility:**
- Screen reader support for WebView content
- Proper labeling for navigation controls

#### 4.3.5 Data Integration

**Weather API Integration:**
```typescript
// OpenWeatherMap API call
const weatherData = await fetch(
  `https://api.openweathermap.org/data/2.5/forecast?zip=13142&appid=${API_KEY}&units=imperial`
);
```

**Error Handling:**
- Weather data: Show cached data if API fails
- WebView: Show error message with retry option
- Network errors: Clear error messaging

**Caching:**
- Weather: Cache for 30 minutes
- WebView: Use WebView's built-in caching
- Offline: Show last cached data with "offline" indicator

---

### 4.4 Tab 4: Settings/Alerts

#### 4.4.1 Overview
The Settings/Alerts tab allows users to configure notification preferences. Alert setup triggers the paywall, making this a key monetization point.

#### 4.4.2 Layout Structure

**Sections:**
1. **Alert Configuration** (Primary Section)
2. **App Settings** (Secondary Section)
3. **Account/Subscription** (Tertiary Section)
4. **About/Legal** (Footer Section)

#### 4.4.3 Alert Configuration

**Alert Types:**

1. **Flow Drop Alert**:
   - **Label**: "Notify me when flow drops below X CFS"
   - **Input**: Numeric input field (slider or text input)
   - **Range**: 0-2000 CFS
   - **Default**: 400 CFS (just below PRIME zone)
   - **Description**: "Get notified when conditions become optimal for fishing"
   - **Icon**: Down arrow or bell icon

2. **Flow Rise Alert**:
   - **Label**: "Notify me when flow rises above X CFS"
   - **Input**: Numeric input field (slider or text input)
   - **Range**: 0-2000 CFS
   - **Default**: 1200 CFS (BLOWN OUT threshold)
   - **Description**: "Get notified when conditions become dangerous"
   - **Icon**: Up arrow or warning icon

**UI Components:**

**Input Method Options:**
1. **Slider** (Preferred for "River Guy"):
   - Large, easy-to-use slider
   - Visual feedback with zone colors
   - Current value displayed prominently
   - Min height: 44px for touch target

2. **Text Input** (Alternative):
   - Numeric keyboard
   - Validation (0-2000 range)
   - Clear formatting

**Alert Card Design:**
- Card-based layout
- Toggle switch to enable/disable alert
- Current threshold value displayed
- Status indicator (Active/Inactive)
- Last triggered timestamp (if applicable)

**Zone Visualization:**
- Show threshold on a mini gauge or number line
- Color-code based on which zone the threshold falls in
- Help text: "This threshold is in the [ZONE] range"

#### 4.4.4 Paywall Integration

**Trigger Points:**
1. **User attempts to enable first alert**: Show paywall
2. **User attempts to enable second alert** (if first is free): Show paywall
3. **User taps "Set Alert" button**: Show paywall

**Paywall Presentation:**
- **Library**: Superwall or RevenueCat
- **Presentation**: Modal overlay
- **Design**: 
  - Dark mode compatible
  - Clear value proposition
  - Feature comparison (Free vs Premium)
  - Pricing display
  - Call-to-action buttons

**Free Tier Limitations:**
- Maximum 1 alert (user's choice: drop or rise)
- Basic notifications only
- No advanced features

**Premium Tier Benefits:**
- Unlimited alerts
- Both drop and rise alerts
- Advanced notification options (time windows, frequency limits)
- Ad-free experience
- Priority data updates
- Historical alert logs

**Paywall Dismissal:**
- User can dismiss paywall
- Alert remains disabled until subscription
- "Maybe Later" option
- Remind user of benefits

#### 4.4.5 Notification Implementation

**Firebase Cloud Messaging (FCM):**
- Register device token on app launch
- Store user's alert preferences in Firestore
- Server-side logic to check conditions and send notifications

**Notification Content:**
- **Title**: "Salmon River Alert"
- **Body**: "Flow has [dropped below/risen above] X CFS. Current: Y CFS"
- **Data Payload**: 
  - Current CFS value
  - Alert type (drop/rise)
  - Timestamp
  - Deep link to Status tab

**Notification Timing:**
- Check conditions every 15 minutes
- Send notification immediately when threshold is crossed
- Rate limiting: Maximum 1 notification per alert per 6 hours (prevent spam)

**Background Processing:**
- Use Firebase Cloud Functions or scheduled job
- Check USGS API every 15 minutes
- Compare against all user alert thresholds
- Send notifications via FCM

#### 4.4.6 App Settings

**General Settings:**
1. **Units**:
   - Temperature: Fahrenheit / Celsius toggle
   - Flow: CFS (fixed, no alternative)
   
2. **Display Preferences**:
   - Font size: Standard / Large / Extra Large
   - Color scheme: Dark (forced, but allow brightness adjustment)

3. **Data Refresh**:
   - Auto-refresh interval: 15 min / 30 min / 1 hour
   - Background refresh: Toggle on/off
   - Data usage warning: Toggle on/off

4. **Notifications** (System-level):
   - Enable/disable all notifications
   - Sound preferences
   - Vibration preferences
   - Notification badge

#### 4.4.7 Account/Subscription

**Account Section:**
- User email/account display
- Sign in / Sign out
- Account deletion option

**Subscription Section:**
- Current subscription status
- Subscription tier (Free / Premium)
- Manage subscription button (links to App Store / Play Store)
- Subscription expiration date (if applicable)
- Upgrade to Premium button (if free tier)

#### 4.4.8 About/Legal

**Footer Section:**
- App version
- Data sources credit:
  - "Flow data provided by USGS"
  - "Weather data provided by OpenWeatherMap"
  - "Dam schedules from SafeWaters.com"
- Privacy Policy link
- Terms of Service link
- Contact/Support link
- Open source licenses (if applicable)

---

## 5. Design System

### 5.1 Color Scheme

**Forced Dark Mode:**
- **Primary Background**: `#121212` (Material Design Dark Surface)
- **Secondary Background**: `#1E1E1E` (Slightly lighter for cards)
- **Tertiary Background**: `#2D2D2D` (For elevated surfaces)

**Text Colors:**
- **Primary Text**: `#FFFFFF` (White, maximum contrast)
- **Secondary Text**: `#B3B3B3` (Light gray, 70% opacity)
- **Tertiary Text**: `#808080` (Medium gray, 50% opacity)
- **Disabled Text**: `#4D4D4D` (Dark gray, 30% opacity)

**Status Zone Colors:**
- **LOW (0-350 CFS)**: `#3B82F6` (Blue-500)
- **PRIME (350-750 CFS)**: `#10B981` (Emerald-500) or `#00FF00` (Neon Green)
- **CAUTION (750-1200 CFS)**: `#F59E0B` (Amber-500) to `#F97316` (Orange-500)
- **BLOWN OUT (1200+ CFS)**: `#EF4444` (Red-500)

**Accent Colors:**
- **Primary Accent**: `#10B981` (Emerald, matches PRIME zone)
- **Warning**: `#F59E0B` (Amber)
- **Error**: `#EF4444` (Red)
- **Info**: `#3B82F6` (Blue)

**Interactive Elements:**
- **Button Primary**: `#10B981` (Emerald)
- **Button Secondary**: `#2D2D2D` (Dark gray)
- **Button Disabled**: `#1E1E1E` (Inactive)
- **Link**: `#3B82F6` (Blue)
- **Border**: `#404040` (Subtle gray)

### 5.2 Typography

**Font Families:**
- **iOS**: San Francisco (SF Pro) - System default
- **Android**: Roboto - System default
- **Fallback**: System sans-serif

**Font Sizes:**
- **Hero Numbers** (Gauge): 72-96pt (extremely large)
- **Status Labels**: 32-40pt (very large)
- **Section Headers**: 24-28pt (large)
- **Body Text**: 16-18pt (standard)
- **Secondary Text**: 14-16pt (small)
- **Caption**: 12-14pt (very small)

**Font Weights:**
- **Hero Numbers**: Bold (700)
- **Headers**: Semi-bold (600) or Bold (700)
- **Body**: Regular (400)
- **Labels**: Medium (500)

**Line Height:**
- **Headers**: 1.2x font size
- **Body**: 1.5x font size
- **Tight**: 1.1x font size (for numbers)

**Letter Spacing:**
- **Numbers**: -0.5px to -1px (tighter for large numbers)
- **Headers**: 0px (normal)
- **Body**: 0.5px (slightly increased for readability)

### 5.3 Spacing System

**Base Unit**: 4px (all spacing multiples of 4)

**Spacing Scale:**
- **XS**: 4px
- **SM**: 8px
- **MD**: 16px
- **LG**: 24px
- **XL**: 32px
- **2XL**: 48px
- **3XL**: 64px

**Component Spacing:**
- **Card Padding**: 16-24px
- **Section Spacing**: 24-32px
- **Element Spacing**: 12-16px
- **Screen Padding**: 16-20px (horizontal)

### 5.4 Interactive Elements

**Touch Targets:**
- **Minimum Height**: 44px (Apple HIG / Material Design standard)
- **Minimum Width**: 44px
- **Preferred**: 48-56px for primary actions
- **Spacing Between**: Minimum 8px to prevent mis-taps

**Buttons:**
- **Primary Button**: 
  - Background: Accent color
  - Text: White, bold
  - Padding: 16px horizontal, 12px vertical
  - Border radius: 8-12px
  - Min height: 48px

- **Secondary Button**:
  - Background: Transparent or secondary background
  - Border: 1-2px solid border color
  - Text: Primary text color
  - Same padding and sizing as primary

- **Text Button**:
  - Background: Transparent
  - Text: Accent color
  - Underline on press (optional)

**Input Fields:**
- **Height**: Minimum 44px
- **Padding**: 12-16px horizontal
- **Border**: 1-2px solid border color
- **Border Radius**: 8px
- **Focus State**: Accent color border, 2px
- **Background**: Secondary background color

**Cards:**
- **Background**: Secondary or tertiary background
- **Border Radius**: 12-16px
- **Padding**: 16-24px
- **Shadow**: Subtle elevation (iOS) or elevation (Android)
- **Border**: Optional 1px border in border color

### 5.5 Icons

**Library**: Lucide Icons
**Size Scale**:
- **Small**: 16px
- **Medium**: 24px
- **Large**: 32px
- **XLarge**: 48px

**Color**: Inherit from text color or use accent colors
**Stroke Width**: 2px (standard), 1.5px (small icons)

### 5.6 Animations

**Principles:**
- Smooth, natural motion
- Purposeful (not decorative)
- Performance-focused (60fps)

**Animation Durations:**
- **Fast**: 200ms (micro-interactions)
- **Standard**: 300-400ms (transitions)
- **Slow**: 600-800ms (gauge animations, page transitions)

**Easing:**
- **Standard**: `ease-in-out`
- **Enter**: `ease-out`
- **Exit**: `ease-in`

**Key Animations:**
- Gauge needle movement: 800-1000ms, smooth easing
- Page transitions: 300ms
- Button press: 100ms scale down
- Data refresh: Subtle fade in/out
- Chart interactions: 200ms

### 5.7 Responsive Design

**Screen Sizes:**
- **Small**: 320-375px width (iPhone SE, small Android)
- **Medium**: 375-414px width (iPhone standard)
- **Large**: 414-480px width (iPhone Plus, large Android)
- **Extra Large**: 480px+ width (Tablets)

**Adaptations:**
- Gauge scales proportionally
- Text sizes adjust slightly (but maintain minimum readability)
- Spacing adjusts for larger screens
- Chart uses available space efficiently

**Orientation:**
- **Primary**: Portrait (optimized for)
- **Landscape**: Functional but not optimized (gauge may be smaller)

### 5.8 Accessibility

**Screen Reader Support:**
- All interactive elements have labels
- Status information is announced
- Chart data is accessible via screen reader
- Navigation is clearly labeled

**Dynamic Type:**
- Support system font size preferences
- Scale text appropriately (with maximum limits for hero numbers)
- Maintain readability at all sizes

**High Contrast:**
- Ensure sufficient contrast ratios (WCAG AA minimum, AAA preferred)
- Text contrast: 4.5:1 minimum for body, 3:1 for large text
- Interactive elements: Clear visual indicators

**Color Blindness:**
- Don't rely solely on color for information
- Use icons, patterns, or text labels in addition to color
- Status zones have distinct visual differences beyond color

**Motor Accessibility:**
- Large touch targets (44px minimum)
- Adequate spacing between interactive elements
- Support for switch control and other assistive technologies

---

## 6. Technical Specifications

### 6.1 Performance Requirements

**App Launch:**
- Cold start: < 2 seconds
- Warm start: < 1 second
- Time to interactive: < 3 seconds

**Data Loading:**
- Initial data fetch: < 2 seconds
- Background refresh: Non-blocking
- Chart rendering: < 1 second for 7-day data

**Animations:**
- Maintain 60fps for all animations
- Gauge animation: Smooth, no jank
- Chart interactions: Responsive, no lag

**Memory:**
- App memory usage: < 100MB typical
- Peak memory: < 200MB
- Efficient image/icon caching

**Battery:**
- Background refresh: Efficient, minimal battery impact
- Location services: Not used (not required)
- Network requests: Optimized, batched when possible

### 6.2 Data Requirements

**API Rate Limits:**
- USGS API: Typically no strict limits, but implement reasonable throttling
- OpenWeatherMap: Respect free tier limits (60 calls/minute)
- Implement request caching to minimize API calls

**Data Storage:**
- Local cache: Last 7 days of flow data
- User preferences: Alert thresholds, settings
- Storage size: < 10MB typical

**Offline Support:**
- Display cached data when offline
- Clear "offline" or "stale data" indicators
- Graceful degradation of features

### 6.3 Security Requirements

**Authentication:**
- Secure token storage (Keychain on iOS, Keystore on Android)
- Firebase Auth secure implementation
- No sensitive data in local storage (unencrypted)

**API Keys:**
- Store in environment variables
- Never commit to version control
- Use Expo's environment variable system

**Data Privacy:**
- Minimal data collection
- User data encrypted in transit and at rest
- GDPR/CCPA compliance considerations
- Privacy policy required

### 6.4 Testing Requirements

**Unit Testing:**
- Flow status calculation logic
- Data transformation functions
- Alert threshold checking

**Integration Testing:**
- API integration tests
- Firebase integration tests
- Chart rendering tests

**E2E Testing:**
- Critical user flows
- Alert setup and triggering
- Paywall presentation

**Device Testing:**
- iOS: iPhone SE, iPhone 12/13/14, iPhone Pro Max
- Android: Various screen sizes and OS versions
- Test in actual outdoor conditions (bright sunlight, low light)

### 6.5 Deployment Requirements

**Build Configuration:**
- iOS: App Store deployment
- Android: Google Play Store deployment
- Expo EAS Build for managed workflow

**Version Management:**
- Semantic versioning (MAJOR.MINOR.PATCH)
- OTA updates for non-native changes
- Native updates require new build

**Analytics:**
- Firebase Analytics integration
- Track key events:
  - App opens
  - Tab navigation
  - Alert setup attempts
  - Paywall presentations
  - Subscription conversions

---

## 7. User Stories

### 7.1 Epic 1: Core Flow Data Display

**Story 1.1**: As "The River Guy", I want to see the current flow status at a glance so I can make an instant Go/No-Go decision.
- **Acceptance Criteria**:
  - Gauge displays current CFS value prominently
  - Status zone is immediately clear (color-coded)
  - Information loads in < 2 seconds
  - Works in bright sunlight and low light

**Story 1.2**: As "The Couch Guy", I want to see historical flow trends so I can understand if conditions are improving or worsening.
- **Acceptance Criteria**:
  - 7-day chart displays clearly
  - Can see flow patterns over time
  - Can tap data points for exact values
  - Chart loads in < 2 seconds

### 7.2 Epic 2: Alert System

**Story 2.1**: As "The Couch Guy", I want to be notified when flow drops below my threshold so I don't miss optimal fishing conditions.
- **Acceptance Criteria**:
  - Can set threshold for flow drop alert
  - Receive push notification when threshold is crossed
  - Notification includes current flow value
  - Notification deep links to app

**Story 2.2**: As a user, I want to understand the value of premium features before subscribing.
- **Acceptance Criteria**:
  - Paywall appears when attempting to set alerts
  - Paywall clearly explains premium benefits
  - Can dismiss paywall without losing progress
  - Subscription process is smooth and secure

### 7.3 Epic 3: Forecast Information

**Story 3.1**: As "The Couch Guy", I want to see weather forecasts so I can plan trips with good weather conditions.
- **Acceptance Criteria**:
  - Current weather displays clearly
  - 7-day forecast is accessible
  - Weather data updates regularly
  - Works offline with cached data

**Story 3.2**: As a user, I want to see dam release schedules so I can plan around water releases.
- **Acceptance Criteria**:
  - WebView loads SafeWaters.com schedule
  - Schedule is readable and navigable
  - Works offline with cached content
  - Can refresh schedule manually

---

## 8. Success Criteria

### 8.1 Launch Criteria
- [ ] All 4 tabs functional and polished
- [ ] Gauge displays accurate, real-time data
- [ ] Chart renders 7-day trends correctly
- [ ] Weather widget displays forecast
- [ ] WebView loads dam schedule
- [ ] Alert system functional (with paywall)
- [ ] App works on iOS and Android
- [ ] Dark mode implemented throughout
- [ ] Accessibility features implemented
- [ ] Performance targets met

### 8.2 Post-Launch Metrics
- **User Acquisition**: Target 1,000 downloads in first month
- **Retention**: 40% Day-7 retention, 20% Day-30 retention
- **Engagement**: Average 3+ app opens per week per user
- **Monetization**: 5-10% conversion to premium subscription
- **User Satisfaction**: 4.5+ star rating on app stores
- **Alert Engagement**: 60%+ of users who set alerts act on notifications

---

## 9. Future Enhancements (Post-MVP)

### 9.1 Additional Features
- Multiple river support (expand beyond Salmon River)
- Social features (share conditions, fishing reports)
- Fishing log/journal integration
- Advanced analytics (best times to fish, patterns)
- Widget support (iOS/Android home screen widgets)
- Apple Watch / Wear OS companion app
- Augmented Reality (AR) river condition overlay

### 9.2 Technical Improvements
- Machine learning for flow prediction
- More frequent data updates (real-time streaming)
- Enhanced offline capabilities
- Improved chart interactions (zoom, pan, annotations)
- Custom alert sounds/vibrations
- Location-based alerts (when user is near river)

---

## 10. Appendices

### 10.1 API Documentation References
- USGS Water Services: https://waterservices.usgs.gov/rest/
- OpenWeatherMap API: https://openweathermap.org/api
- Firebase Documentation: https://firebase.google.com/docs
- Expo Router: https://docs.expo.dev/router/introduction/

### 10.2 Design Resources
- Material Design Dark Theme: https://material.io/design/color/dark-theme.html
- Apple Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/
- Lucide Icons: https://lucide.dev/

### 10.3 Glossary
- **CFS**: Cubic Feet per Second (flow measurement unit)
- **USGS**: United States Geological Survey
- **FCM**: Firebase Cloud Messaging
- **PRD**: Product Requirements Document
- **MVP**: Minimum Viable Product
- **HIG**: Human Interface Guidelines

---

**Document End**

*This PRD is a living document and should be updated as the product evolves.*

