# Location Generator Creator - User Manual

## Overview
The Location Generator Creator is a tool designed to simulate and generate location data for devices. It allows users to create, modify, and visualize location trails, which can be used for testing and development purposes. The tool supports various features such as setting environment, device serial numbers, location methods, and more.

## Features
- **Environment Selection**: Choose the environment for the device.
- **Device Serial Number**: Input the master and mirror device serial numbers.
- **Location Method**: Select the location method (e.g., GNSS, LBS, BLP, Cache).
- **GeoJSON Upload**: Upload a GeoJSON file to load location data.
- **Trail Visualization**: Visualize the location trail on a map.
- **Location Injection**: Simulate location data injection with configurable parameters.
- **Rule Triggering**: Set rules to trigger based on location data.

## Usage

### 1. Environment Selection
- **Environment**: Select the environment from the dropdown list. This will determine the context in which the location data is generated.

### 2. Device Serial Number
- **Master Device Serial Number**: Enter the serial number of the master device.
- **Mirror Device Serial Number**: Optionally, enter the serial number of the mirror device if you want to simulate a mirrored device.

### 3. Location Method
- **Location Method**: Choose the method used to determine the location (e.g., GNSS, LBS, BLP, Cache).
- **Location Sub-Method**: If using LBS, select the sub-method (e.g., Wifi, Cell).

### 4. GeoJSON Upload
- **Upload GeoJSON File**: Upload a GeoJSON file containing the location data. Ensure that each feature in the FeatureCollection has properties for time and speed.

### 5. Trail Visualization
- **Show Map**: Toggle the map visibility to visualize the location trail.
- **Zoom on Last Point**: Zoom the map to the last point in the trail.
- **Clear All**: Clear all markers and reset the trail.

### 6. Location Injection
- **Start**: Begin injecting location data based on the configured parameters.
- **Pause/Continue**: Pause or continue the location data injection.
- **Reset**: Reset the location data injection process.

### 7. Rule Triggering
- **Trigger Rule on Trail**: Set a rule to trigger based on the location trail. You can select a rule and apply it to the trail.

## Configuration

### Speed and Error
- **Speed (Km/h)**: Set the speed at which the device is moving.
- **Error (Meters)**: Set the margin of error for the location data.
- **Logging Rate (Sec.)**: Set the interval at which location data is logged.

### Fire Rate
- **Fire Point Rate (Sec.)**: Set the interval at which location points are fired.
- **Fire Report Rate (Sec.)**: Set the interval at which location reports are fired.
- **Timeout Between Days (Sec.)**: Set the timeout between days for location data injection.

### Advanced Options
- **Mark Location with Error**: Toggle whether to mark locations with error.
- **Advance Trail Over Time**: Toggle whether to advance the trail over time.
- **Number of Loops**: Set the number of loops for advancing the trail over time.

## Troubleshooting
- **No Trail to Inject**: Ensure that a GeoJSON file is uploaded and contains valid location data.
- **Device SN Can't Be Empty**: Ensure that the master device serial number is entered.
- **Mirror Device SN Can't Be Empty**: If using a mirror device, ensure that the mirror device serial number is entered.

## Support
For any issues or questions, please contact the support team.

---

**Note**: This tool is intended for testing and development purposes only. Use it responsibly.
