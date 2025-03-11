<template>
  <div class="mapWrapper">
    <div class="inputContainer">
      <div class="subjectContainer">
        <div class="singleInput">
          <span class="singleInputHeader">Environment:</span>
          <div style="z-index: 10000">
            <environement-select-list
              v-on:onEnvironementSelected="onEnvironementChange"
              :address="address"
              style="width: 250px"
            ></environement-select-list>
          </div>
        </div>
        <div class="singleInput">
          <span class="singleInputHeader">Device Serial Number:</span>
          <a-input
            v-model:value="masterSerial"
            @change="onSerialChange($event)"
            placeholder="Please enter serial number"
          />
        </div>
        <div class="singleInput">
          <input type="checkbox" v-model="showMirrorDeviceSerial">
          <span class="singleInputHeader" style="
                        margin-left: 5px;">Add Mirror Device</span>
                      <input type="checkbox" v-model="showLegacySubjectID">
                         <span class="singleInputHeader" style="
                        margin-left: 5px;">Legacy Subject</span>
        </div>
          <div class="singleInput" v-show="showLegacySubjectID">
          <span class="singleInputHeader">Legacy Subject ID:</span>
          <a-input
            v-model:value="subjectID"
            @change="onSubjectIDChanged($event)"
            placeholder="Please enter subjectID:"
          />
        </div>
         <div class="singleInput" v-show="showMirrorDeviceSerial">
          <span class="singleInputHeader">Mirror Device Serial Number:</span>
          <a-input
            v-model:value="mirrorSerial"
            @change="onMirrorSerialChange($event)"
            placeholder="Please enter serial number"
          />
        </div>
         <div class="singleInput" v-show="showMirrorDeviceSerial && showLegacySubjectID">
          <span class="singleInputHeader">Mirror Device SubjectID:</span>
          <a-input
            v-model:value="mirrorSubjectID"
            @change="onMirrorSubjectIDChange($event)"
            placeholder="Please enter serial number"
          />
        </div>
        
      </div>
      <div class="mapControlContainer">
        <div class="singleInput">
          <div><span class="singleInputHeader">Upload GeoJson File:</span></div>
          <div
            @mouseenter="showTipFile = true"
            @mouseleave="showTipFile = false"
            style="z-index: 1000; position: relative"
          >
            <a-input
              ref="file"
              v-on:input="onChangeFileUpload"
              type="file"
              id="uploadFile"
            />
            <div
              id="tooltip"
              v-if="showTipFile"
              :style="{ top: `0px`, left: `95px` }"
            >
              <div style="font-weight: bold">
                *Make sure each feature in the FeatureCollection
              </div>
              <div style="font-weight: bold">
                properties contain keys for time and speed.
              </div>
              <p></p>
              <div>Example:</div>
              <pre> {{ JSON.stringify(tipExample, undefined, 2) }}</pre>
            </div>
          </div>
        <div class="singleInput">
              <div
                style="display: flex; flex-direction: row; align-items: center"
              >
             
                <div style="flex-basis: 200px">
                  <span class="singleInputHeader">Speed (Kmh):</span>
                </div>
                 <a-input
              style="width: 85px; margin-left:-30px; margin-top:5px"
              v-model:value="subjectSpeedKMPH"
              placeholder="Speed..."
            />
                 
                
              </div>

                <div
                style="display: flex; flex-direction: row; align-items: center"
              >
             
                <div style="flex-basis: 200px">
                  <span class="singleInputHeader">Error (Meters):</span>
                </div>
                 <a-input
              style="width: 85px; margin-left:-30px; margin-top:5px"
                v-model:value="LocationMarginError"
              placeholder="Speed..."
            />
                 
                
              </div>

                 <div
                style="display: flex; flex-direction: row; align-items: center"
              >
             
                <div style="flex-basis: 200px">
                  <span class="singleInputHeader">Logging Rate (Sec.):</span>
                </div>
                 <a-input
              style="width: 85px; margin-left:-30px; margin-top:5px"
                v-model:value="deviceSamplingSeconds"
              placeholder="Speed..."
            />
                 
                
              </div>

   <div
                style="display: flex; flex-direction: row; align-items: center"
              >
             
                <div style="flex-basis: 200px">
                  <span class="singleInputHeader">Location Method:</span>
                </div>
                 <a-select
                   style="width: 85px; margin-left:-30px; margin-top:5px"
            @change="onChangeLocationMethod"
            v-model:value="locationMethod"
            :options="locationMethodItems.map((item) => ({ value: item }))"
            placeholder="Choose location method"
            class="selectLocationMethod"
          >
            </a-select>
                
              </div>
        </div> 
        </div> 
        <div v-show="locationMethod === 'LBS'" class="singleInput">
          <div>
            <span class="singleInputHeader">Location SubMethod:</span>
          </div>
          <a-select  
            v-model:value="locationSubMethod"
            :options="locationSubMethodItems.map((item) => ({ value: item }))"
            placeholder="Choose location sub method"
            class="selectLocationMethod"
          >
          </a-select>
        </div>


 <div
                style="display: flex; flex-direction: row; align-items: center"
              >
             
                <div style="flex-basis: 200px; margin-bottom:10px">
                  <span class="singleInputHeader">Trigger Rule on Trail:</span>
                </div>
                <a-button
                style="margin-left: 5px;margin-right: 15px"
                size="small"
                shape="round"
                type="primary"
                @click="openRuleComponent"
              >
                {{ !showRules ? "Select Rule" : "Hide" }}
              </a-button>
                <a-button
                v-show="ruleDetails && ruleDetails.ruleID"
                style="margin-left: 5px"
                :disabled="!ruleDetails || Object.keys(ruleDetails).length == 0"
                size="small"
                shape="round"
                type="primary"
                @click="clearRule"
              >
                {{
                  ruleDetails && ruleDetails.ruleID
                    ? "Clear Rule " + ruleDetails.ruleID
                    : "Clear"
                }}
              </a-button>
              </div>


      

        <div class="singleInput">
          <div><span class="singleInputHeader">Last Location Time:</span></div>
          <a-space direction="vertical" style="width: 250px">
            <a-date-picker
              placeholder="Choose dates"
              v-model:value="lastPointTime[lastPointTime.length - 1]"
              :style="{ color: 'white', 'min-width': '250px' }"
              format="YYYY-MM-DD HH:mm:ss"
              @change="updateDate"
              :show-time="{
                defaultValue: lastPointTime[lastPointTime.length - 1],
              }"
            />
          </a-space>
        </div>

        <div class="buttonsLineSeperator"></div>
        <div
          div
          class="singleInput"
          style="display: flex; flex-direction: row; align-items: center"
        >
          <div>
            <div class="singleInput">
              <div
                style="display: flex; flex-direction: row; align-items: center"
              >
                <a-radio
                  :disabled="!allowEditFireRate"
                  @click="fireType = 'pointRate'"
                  :checked="fireType === 'pointRate'"
                  style="margin-right: 10px"
                />
                <div style="flex-basis: 200px">
                  <span class="singleInputHeader">Fire Point Rate (Sec.):</span>
                </div>
                <a-input
                  style="width: 50px"
                  v-model:value="fireTimeoutSec"
                  placeholder="Put Seconds Here..."
                  :readonly="!allowEditFireRate"
                />
              </div>
            </div>
            <div class="singleInput">
              <div
                style="display: flex; flex-direction: row; align-items: center"
              >
                <a-radio
                  :disabled="!allowEditFireRate"
                  @click="fireType = 'reportRate'"
                  :checked="fireType === 'reportRate'"
                  style="margin-right: 10px"
                />
                <div style="flex-basis: 200px">
                  <span class="singleInputHeader"
                    >Fire Report Rate (Sec.):</span
                  >
                </div>
                <a-input
                  style="width: 50px"
                  v-model:value="fireBatchTimeoutSec"
                  placeholder="Put Seconds Here..."
                  :readonly="!allowEditFireRate"
                />
              </div>
            </div>
            <div class="singleInput" v-if="!(fireType === 'reportRate')">
              <div 
                style="display: flex; flex-direction: row; align-items: center"
              >
                <div style="flex-basis: 200px">
                  <span class="singleInputHeader"
                    >Timeout between days (Sec.):</span
                  >
                </div>
                <a-input
                  style="width: 50px"
                  v-model:value="fireTimeoutBetweenDaysSec"
                  placeholder="Put Seconds Here..."
                  :readonly="!allowEditFireRate"
                />
              </div>
            </div>
            <div class="singleInput">
              <div
                style="display: flex; flex-direction: row; align-items: center"
              >
                <a-switch v-model:checked="markLocationWithError"
                style="margin-right: 10px"/>
                <div style="flex-basis: 200px">
                  <span class="singleInputHeader"
                    >Mark location with error</span>
                </div>
              </div>
              <div
                style="display: flex; flex-direction: row; align-items: center"
              >
                <a-switch v-model:checked="showMap"
                style="margin-top: 10px; margin-right: 10px"/>
                <div style="flex-basis: 200px">
                  <span class="singleInputHeader"
                    >Show Map</span>
                </div>
              </div>
              <div
                style="display: flex; flex-direction: row; align-items: center"
              >
                <a-switch v-model:checked="advanceTrailOverTime"
                style="margin-top: 10px; margin-right: 10px"/>
                <div style="flex-basis: 200px">
                  <span class="singleInputHeader"
                    >Advance Trail Over Time</span>
                </div>
              </div>
              <div class="singleInput" v-show="advanceTrailOverTime">
                <div>
                  <span class="singleInputHeader">Number of loops:</span>
                </div>
                <a-input
                  v-model:value="advanceTrailOverTimeNumOfLoops"
                  placeholder="Number of Loops..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="singleInput">
        <a-space style="padding-left: 20px; gap: 10px; width: 100%">
          <a-button
            :disabled="progress > 0"
            size="medium"
            shape="round"
            type="primary"
            @click="sendPoints"
          >
            Start
          </a-button>
          <a-button
            :disabled="
              progress == 0 || progress >= this.geojson.features.length
            "
            size="medium"
            shape="round"
            type="primary"
            @click="onPause"
          >
            {{ inPause ? "Cont" : "Pause" }}
          </a-button>
          <a-button
            :disabled="progress == 0"
            size="medium"
            shape="round"
            type="primary"
            @click="clearAllFirePoints"
          >
            Reset
          </a-button>
        </a-space>
      </div>

      <div></div>
    </div>
    <div v-show="!showRules" id="map-area">
      <a-space id="map-tools" style="gap: 10px; width: 100%">
        <a-button
          size="medium"
          shape="round"
          type="primary"
          @click="clearAllPage"
        >
          <template #icon><ClearOutlined /></template>
        </a-button>

        <a-button
          size="medium"
          shape="round"
          type="primary"
          @click="hideTrailTimeChange = !hideTrailTimeChange"
        >
          <template #icon><ClockCircleOutlined /></template>
        </a-button>
        <a-button
          size="medium"
          shape="round"
          type="primary"
          @click="downloadFile"
        >
          <template #icon><DownloadOutlined /></template>
        </a-button>
        <a-button
          size="medium"
          shape="round"
          type="primary"
          @click="zoomOnLastPoint"
        >
          <template #icon><ZoomInOutlined /></template>
        </a-button>

        <a-button size="medium" shape="round" type="primary" @click="goBack">
          <template #icon><UndoOutlined /></template>
        </a-button>
        <a-button
          size="medium"
          shape="round"
          type="primary"
          @click="showDataOnScreen"
        >
          {{ !this.showData ? "Show Raw" : "Hide Raw" }}</a-button
        >
        <div class="progressTitle" v-if="progress > 0">
          {{ progressDetails }} |
        </div>

        <div class="progressTitle" v-if="progress > 0">
          {{ timeLeftDetails }} |
        </div>
        <div class="progressTitle" v-if="progress > 0">
          {{ timeLeftDate }} |
        </div>
        <div class="progressTitle" v-if="timeTimeout!=''">
          {{ timeTimeout }}
        </div>
        <div v-if="advanceTrailOverTime" class="singleInputTotal">
          <span class="singleInputHeader"
            >Loop Trail: {{ processAdvanceTrailOverTimeNumOfLoops }} out of {{ advanceTrailOverTimeNumOfLoops }}</span
          >
        </div>
        <div v-if="progress == 0" class="singleInputTotal">
          <span class="singleInputHeader"
            >Total Locations: {{ geojson.features.length.toString() }}</span
          >
        </div>
        <div
          v-if="progress == 0 && trailDuration.asSeconds() > 0"
          class="singleInputTotal"
        >
          <span class="singleInputHeader"
            >|&nbsp;&nbsp;Trail Duration: {{ trailDurationHeader }}</span
          >
        </div>
      
        <!-- <div
          v-if="progress == 0 && trailDuration.asSeconds() > 0"
          class="singleInputTotal"
        >
          <span class="singleInputHeader"
            >|&nbsp;&nbsp;Last Point Sent: {{ trailLastPointSentHeader }}</span
          >
        </div> -->
      </a-space>
      <div v-if="!hideTrailTimeChange">
        <a-space style="padding-left: 20px; gap: 10px; width: 100%">
          <div class="singleInput">
            <div>
              <span class="singleInputHeader">From:</span>
            </div>
            <a-space direction="vertical" style="width: 250px">
              <a-date-picker
                placeholder="Choose dates"
                :disabled="true"
                v-model:value="firstPointTime"
                :style="{ color: 'white', 'min-width': '250px' }"
                format="YYYY-MM-DD HH:mm:ss"
                :show-time="{
                  defaultValue: firstPointTime,
                }"
              />
            </a-space>
            <div>
              <span class="singleInputHeader">To:</span>
            </div>
            <a-space direction="vertical" style="width: 250px">
              <a-date-picker
                placeholder="Choose dates"
                :disabled="true"
                v-model:value="lastPointTime[lastPointTime.length - 1]"
                :style="{ color: 'white', 'min-width': '250px' }"
                format="YYYY-MM-DD HH:mm:ss"
                :show-time="{
                  defaultValue: lastPointTime[lastPointTime.length - 1],
                }"
              />
            </a-space>
          </div>
          <div class="singleInput" style="margin: 20px; font-size: 22px">
            <SwapOutlined />
          </div>
          <div class="singleInput">
            <div>
              <span class="singleInputHeader">From:</span>
            </div>
            <a-space direction="vertical" style="width: 250px">
              <a-date-picker
                placeholder="Choose dates"
                v-model:value="changeTrailTimeFrom"
                :style="{ color: 'white', 'min-width': '250px' }"
                format="YYYY-MM-DD HH:mm:ss"
                @change="updateDateChangeTrailTimesFrom"
                :show-time="{
                  defaultValue: changeTrailTimeFrom,
                }"
              />
            </a-space>
            <div>
              <span class="singleInputHeader">To:</span>
            </div>
            <a-space direction="vertical" style="width: 250px">
              <a-date-picker
                placeholder="Choose dates"
                v-model:value="changeTrailTimeTo"
                :style="{ color: 'white', 'min-width': '250px' }"
                format="YYYY-MM-DD HH:mm:ss"
                @change="updateDateChangeTrailTimesTo"
                :show-time="{
                  defaultValue: changeTrailTimeTo,
                }"
              />
            </a-space>
          </div>
          <a-space style="padding-left: 20px; gap: 10px; width: 100%">
            <a-button
              size="medium"
              shape="round"
              type="primary"
              @click="changeTrailTimes"
            >
              Save</a-button
            >
            <a-button
              size="medium"
              shape="round"
              type="primary"
              @click="hideTrailTimeChange = true"
            >
              Cancel</a-button
            >
          </a-space>
        </a-space>
      </div>
      <div style="display: flex; flex-flow: row">
        <div id="mapContainer" v-show="showMap"></div>
        <div>
          <!-- <vue-json-pretty v-if="false" class="freeJson" :data="geojson"> </vue-json-pretty> -->
          <pre class="freeJson" v-if="showData">{{
            JSON.stringify(geojson, undefined, 2)
          }}</pre>
        </div>
      </div>
      <span> {{ currentLocationDescription }} </span>
    </div>
    <Rules
      v-show="showRules"
      ref="rules"
      :showEnv="false"
      :showSend="false"
      :showSet="true"
      :showSerial="false"
      :showSendLocation="false"
      @setTriggerRule="onSetTriggerRuleClick"
    ></Rules>
  </div>
</template>

<script>
import {
  UndoOutlined,
  CloseOutlined,
  ZoomInOutlined,
  DownloadOutlined,
  ClockCircleOutlined,
  RightOutlined,
  ClearOutlined,
  CaretRightOutlined,
  SwapOutlined,
} from "@ant-design/icons-vue";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css"; // Re-uses images from ~leaflet package
import * as L from "leaflet";
import "leaflet-defaulticon-compatibility";
import * as turf from "@turf/turf";
import Swal from "sweetalert2";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import randomLocation from "random-location";
import moment from "moment";
import VueJsonPretty from "vue-json-pretty";
import "vue-json-pretty/lib/styles.css";
require("leaflet-rotatedmarker/leaflet.rotatedMarker.js");
const download = require("downloadjs");
const movementBlue = require("./graphic/movement_blue.png");
const movementGreen = require("./graphic/movement_green.png");
const movementOrange = require("./graphic/movement_orange.png");
const movementRed = require("./graphic/movement_red.png");
const stopBlue = require("./graphic/stop_heading_blue.svg");
const stopGreen = require("./graphic/stop_heading_green.svg");
const stopOrange = require("./graphic/stop_heading_orange.svg");
const stopRed = require("./graphic/stop_heading_red.svg");
import { notification } from "ant-design-vue";
import EnvironementSelectList from "../components/envSelectList.vue";
import * as config from "../configuration";
import * as locationService from "../services/location.service";
import appState from "../appState";
import { defineComponent, ref } from "vue";
import Rules from "./Rules";
import { thisTypeAnnotation } from "@babel/types";

export default {
  name: "LeafletMap",
  components: {
    VueJsonPretty,
    UndoOutlined,
    CloseOutlined,
    ZoomInOutlined,
    DownloadOutlined,
    ClockCircleOutlined,
    ClearOutlined,
    RightOutlined,
    CaretRightOutlined,
    EnvironementSelectList,
    SwapOutlined,
    Rules,
  },
  data() {
    return {
      currentLocationDescription: "",
      hideTrailTimeChange: true,
      changeTrailTimeFrom: moment(new Date()),
      masterSerial: appState.masterSerial,
      mirrorSerial: null,
      mirrorSubjectID: null,
      subjectID: appState.isLegacy?appState.sybaseOffenderID: '',
      showRules: false,
      inPause: false,
      showMap: true,
      advanceTrailOverTime: false,
      advanceTrailOverTimeNumOfLoops: 1,
      processAdvanceTrailOverTimeNumOfLoops: 1,
      showMirrorDeviceSerial: false,
      showLegacySubjectID:appState.isLegacy,
      
      address: appState.selectedEnv,
      tipExample: {
        type: "FeatureCollection",
        features: [
          {
            groupId: 0,
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [32.10636043274741, 34.82894597627974],
            },
            properties: {
              time: {
                utc: "2022-01-17T10:33:34.721Z",
                tz: "Asia/Jerusalem",
              },
              speedKMH: 5,
              accuracy: 12
            },
          },
          {
            groupId: 1,
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [32.10624712020548, 34.82943433272151],
            },
            properties: {
              time: {
                utc: "2022-01-17T10:34:34.721Z",
                tz: "Asia/Jerusalem",
              },
              speedKMH: 3,
              accuracy: 15
            },
          },
        ],
      },
      map: null,
      ruleDetails: {},
      showTipFile: false,
      file: "",
      geojson: {
        type: "FeatureCollection",
        features: [],
      },
      progress: 0,
      timeinterval: null,
      fireTimeoutSec: 1.0,
      fireBatchTimeoutSec: 120.0,
      fireType: "pointRate",
      fireTimeoutBetweenDaysSec: 0,
      fireTimeoutBetweenDaysTimeHelper: undefined,
      allowEditFireRate: true,
      frmStopPopup: {},
      showData: false,
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution:
        '&copy; <a target="_blank" href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      zoom: 15,
      center: [32.10654654407698, 34.834337811917074],
      groupId: -1,
      lastfeature: null,
      lastPointTime: [moment(new Date())],
      customIcon: null,
      subjectSpeedKMPH: 5,
      deviceSamplingSeconds: 60,
      LocationMarginError: 12,
      locationMethodItems: ref(["GNSS", "LBS", "BLP", "Cache"]),
      locationMethod: ref("GNSS"),
      locationSubMethodItems: ref(["NONE", "Wifi", "Cell"]),
      locationSubMethod: ref("NONE"),
      markLocationWithError: true,
    };
  },
  mounted() {
    this.map = L.map("mapContainer", { preferCanvas: true }).setView(
      this.center,
      this.zoom
    );

    //set up a customized icon to use for the point data
    // this.customIcon = new LeafIcon({
    // iconUrl: 'http://leafletjs.com/examples/custom-icons/leaf-green.png',
    // shadowUrl: 'http://leafletjs.com/examples/custom-icons/leaf-shadow.png'
    // })
    L.tileLayer(this.url, { attribution: this.attribution }).addTo(this.map);

    this.map.pm.addControls({
      position: "topleft",
      drawMarker: true,
      drawCircle: true,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: false,
      drawPolygon: false,
      editMode: true,
      dragMode: false,
      cutPolygon: false,
      removalMode: false,
      rotateMode: false,
      editControls: false,
    });

    this.map.on("pm:create", this.onMapClick);
  },
  async beforeMount() {
    if (this.map) {
      this.map.remove();
    }
  },
  methods: {
    convertJson2HTMLTable(json, keysList) {
      let html = `<table>
                  <tr>
                    <th style="width:120px">Key</th>
                    <th>Value</th>
                  </tr>`;
      for (const key of keysList) {
        if (Object.keys(json).includes(key)) {
          html += "<tr>";
          html += "<td>" + key + "</td>";
          html += "<td>" + JSON.stringify(json[key]) + "</td>";
          html += "</tr>";
        }
      }
      html += "</table>";
      return html;
    },
    clearRule() {
      this.ruleDetails = {};
      console.log("Rule cleared");
    },
    getSelectedRuleID() {},
    openRuleComponent() {
      this.showRules = !this.showRules;
    },
    setRule() {
      if (
        this.$refs.rules &&
        this.$refs.rules.$refs.rulesDetails &&
        this.$refs.rules.$refs.rulesDetails.onSet
      ) {
        console.log("Set new rule");
        this.$refs.rules.$refs.rulesDetails.onSet();
      } else {
        console.log("Cannot click child set unavaliable");
      }
    },
    onSetTriggerRuleClick(rule) {
      if (rule && rule.ruleID && rule.ruleID > 0) {
        this.ruleDetails = rule;
        console.table("New Rule Set", rule);
        this.showRules = false;
      }
    },
    onChangeLocationMethod(item) {
      this.locationMethod = item;
      console.log("locationMethod", item);
      this.locationSubMethod = "NONE";
    },
    async onChangeFileUpload() {
      console.log("start upload file");
      this.file = await event.target.files[0];
      let tempGeojson = JSON.parse(await this.file.text());
      console.log("finish upload file");
      if (tempGeojson.type === "FeatureCollection") {
        this.clearAllMarkers();
        this.groupId = 0;
        for (let i = 0; i < tempGeojson.features.length; i++) {
          if (tempGeojson.features[i].groupId) {
            if (this.groupId != tempGeojson.features[i].groupId) {
              this.groupId = tempGeojson.features[i].groupId;
            }
          } else {
            tempGeojson.features[i].groupId = this.groupId;
          }
          this.lastPointTime[tempGeojson.features[i].groupId] = moment(
            new Date(tempGeojson.features[i].properties.time.utc)
          );
          let lat = tempGeojson.features[i].geometry.coordinates[0];
          let lng = tempGeojson.features[i].geometry.coordinates[1];
          let lbsSubMethod =
            tempGeojson.features[i].properties
              .lbsInfo?.subMethod;
          this.addGeoFeature(
            lat,
            lng,
            moment(new Date(tempGeojson.features[i].properties.time.utc)),
            tempGeojson.features[i].properties.speedKMH,
            tempGeojson.features[i].groupId,
            false,
            tempGeojson.features[i].properties.locationMethod,
            tempGeojson.features[i].properties.setZero,
            tempGeojson.features[i].properties.ruleDetails,
            tempGeojson.features[i].properties.accuracy,
            lbsSubMethod
          );
          console.log(i, " out of ", tempGeojson.features.length);
        }
        if (tempGeojson.features.length > 0) {
          let coordinates =
            tempGeojson.features[tempGeojson.features.length - 1].geometry
              .coordinates;
          //set view
          this.map.setView(coordinates, this.zoom);
          //set last location method from file
          let locMethod =
            tempGeojson.features[tempGeojson.features.length - 1].properties
              .locationMethod;
          this.locationMethod = locMethod ? locMethod : this.locationMethod;
          let lbsSubMethod =
              tempGeojson.features[tempGeojson.features.length - 1].properties
              .lbsInfo?.subMethod;
          this.locationSubMethod = lbsSubMethod ? lbsSubMethod : this.locationSubMethod;
        }
      }
      console.log("finish adding data");
    },

    showDataOnScreen() {
      this.showData = !this.showData;
    },

    downloadFile() {
      download(JSON.stringify(this.geojson), "geojson.json", "text/plain");
    },

    updateDate(inputTime) {
      this.lastPointTime[this.lastPointTime.length - 1] = moment(inputTime);
    },
    updateDateChangeTrailTimesFrom(inputTime) {
      this.changeTrailTimeFrom = moment(inputTime);
    },
    updateDateChangeTrailTimesTo(inputTime) {
      this.changeTrailTimeFrom = moment(inputTime).add(
        -this.trailDuration.asSeconds(),
        "seconds"
      );
    },
    toRadians(degrees) {
      return (degrees * Math.PI) / 180;
    },

    openNotification(message) {
      notification.open({
        message: message,
        description: "",
        duration: 4,
        placement: "bottomRight",
      });
    },

    toDegrees(radians) {
      return (radians * 180) / Math.PI;
    },

    async changeMarkerToGreen(leaflet_id) {
      let map = this.map;
      let greenIcon = new L.Icon({
        iconUrl: movementGreen,
        iconSize: [20, 20],
      });
      let layer = this.map._layers[leaflet_id];

      let stopgreenIcon = new L.Icon({
        iconUrl: stopGreen,
        iconSize: [20, 20],
      });
      if (
        layer.options.heading === null ||
        layer.options.rotationAngle === null
      ) {
        layer.setIcon(stopgreenIcon);
      } else {
        layer.setIcon(greenIcon);
      }
    },
    async changeMarkerToOrange(leaflet_id) {
      let map = this.map;
      let orangeIcon = new L.Icon({
        iconUrl: movementOrange,
        iconSize: [20, 20],
      });
      let layer = this.map._layers[leaflet_id];

      let stoporangeIcon = new L.Icon({
        iconUrl: stopOrange,
        iconSize: [20, 20],
      });
      if (
        layer.options.heading === null ||
        layer.options.rotationAngle === null
      ) {
        layer.setIcon(stoporangeIcon);
      } else {
        layer.setIcon(orangeIcon);
      }
    },
    removeAllGreens(leaflet_id) {
      let map = this.map;
      let blueIcon = new L.Icon({
        iconUrl: movementBlue,
        iconSize: [20, 20],
      });
      let stopblueIcon = new L.Icon({
        iconUrl: stopBlue,
        iconSize: [20, 20],
      });
      let redIcon = new L.Icon({
        iconUrl: movementRed,
        iconSize: [20, 20],
      });
      let stopredIcon = new L.Icon({
        iconUrl: stopRed,
        iconSize: [20, 20],
      });

      this.geojson.features.forEach((feature) => {
        let layer = this.map._layers[feature.leaflet_id];
        if (
          layer.options.heading === null ||
          layer.options.rotationAngle === null
        ) {
          if (
            !layer.options.ruleDetails ||
            Object.keys(layer.options.ruleDetails).length == 0
          ) {
            layer.setIcon(stopblueIcon);
          } else {
            layer.setIcon(stopredIcon);
          }
        } else {
          if (
            !layer.options.ruleDetails ||
            Object.keys(layer.options.ruleDetails).length == 0
          ) {
            layer.setIcon(blueIcon);
          } else {
            layer.setIcon(redIcon);
          }
        }
      });
    },

    onPause() {
      if (this.inPause) {
        this.sendPoints();
      } else {
        this.pauseFirePoints();
      }
    },

    clearAllFirePoints() {
      clearInterval(this.timeinterval);
      this.progress = 0;
      this.processAdvanceTrailOverTimeNumOfLoops = 1
      this.removeAllGreens();
      this.allowEditFireRate = true;
      this.inPause = false;
    },

    pauseFirePoints() {
      clearInterval(this.timeinterval);
      this.allowEditFireRate = true;
      this.inPause = !this.inPause;
    },

    sendPoints(){
      this.inPause = false;
      if (this.masterSerial.length === 0) {
        this.openNotification(`Device SN can't stay be empty`);
        return;
      }
      if (this.geojson.features.length == 0) {
        this.openNotification(`There no trail to inject`);
        return;
      }

      if ((!this.mirrorSerial || this.mirrorSerial.length == 0) && this.showMirrorDeviceSerial) {
        this.openNotification(`Mirror device SN can't stay be empty`);
        return;
      }

      if (this.showMirrorDeviceSerial && this.masterSerial===this.mirrorSerial) {
        this.openNotification(`Device and Mirror SN can't be the same`);
        return;
      }

      if (this.allowEditFireRate == true) {
        this.allowEditFireRate = false;
        let fireTimeoutSec = this.fireTimeoutSec;
        let fireBatchTimeoutSec = this.fireBatchTimeoutSec;
        let duration = this.trailDuration;
        let fireTBDSec = parseInt(this.fireTimeoutBetweenDaysSec);
        //example how to loop with timeout
        let totalPoints = this.geojson.features.length;
        if (this.fireType === "pointRate") {
          this.timeinterval = setInterval(() => {
            if (this.progress < totalPoints) {
              
              let feature = this.geojson.features[this.progress];
              
              if (!this.fireTimeoutBetweenDaysTimeHelper){
                 let response = locationService.injectLocation(
                  feature,
                  this.masterSerial,
                  this.address,
                  this.progress + 1,
                  this.showLegacySubjectID? true: false,
                  this.showLegacySubjectID? this.subjectID: null
                  

                );
              }

              //console.log("Fire Point:" + JSON.stringify(response));
              this.changeMarkerToGreen(feature.leaflet_id);

              if (this.showMirrorDeviceSerial){
                let feature2 =  JSON.parse(JSON.stringify(this.geojson.features[totalPoints-this.progress-1]));
                feature2.properties.time = feature.properties.time
                let subjectID=null;
                if (this.showLegacySubjectID)
                { 
                    subjectID=this.mirrorSubjectID
                }
                if (!this.fireTimeoutBetweenDaysTimeHelper){
                  let response = locationService.injectLocation(
                    feature2,
                    this.mirrorSerial,
                    this.address,
                    totalPoints-this.progress+1,
                    subjectID? true:false,
                    subjectID
                  );
                }

                //console.log("Fire Point:" + JSON.stringify(response));
                this.changeMarkerToOrange(feature2.leaflet_id);
              }


              //timeout between days
              if (this.fireTimeoutBetweenDaysSec>0 && this.progress>=1 && 
                  (moment(this.geojson.features[this.progress].properties.time.utc).startOf('day').toString()!= moment(this.geojson.features[this.progress-1].properties.time.utc).startOf('day').toString())){
                  this.fireTimeoutBetweenDaysTimeHelper = this.fireTimeoutBetweenDaysTimeHelper || moment(Date.now());
                  if (this.fireTimeoutBetweenDaysTimeHelper && (moment(Date.now()).diff(this.fireTimeoutBetweenDaysTimeHelper,'seconds')>=fireTBDSec)){
                    this.progress = (this.progress+ 1);
                    console.log("Fire progress from timeout: ", this.progress);
                    this.fireTimeoutBetweenDaysTimeHelper = undefined;
                    return;
                  }
              } else {
                this.progress = (this.progress+ 1);
                console.log("Fire progress: ", this.progress);
              }

              if (this.progress >= totalPoints) {
                if (this.advanceTrailOverTime && (this.processAdvanceTrailOverTimeNumOfLoops+1)<=this.advanceTrailOverTimeNumOfLoops){
                  let nextTime = this.lastPointTime[this.lastPointTime.length - 1];
                  nextTime.add(this.deviceSamplingSeconds, 'seconds');
                  console.log("advanceTrailOverTime", nextTime)
                  this.updateDateChangeTrailTimesFrom(nextTime)
                  this.changeTrailTimes()
                  this.progress = 0;
                  this.intervalSum = 0;
                  this.removeAllGreens();
                  this.processAdvanceTrailOverTimeNumOfLoops = this.processAdvanceTrailOverTimeNumOfLoops+1
                  return;
                }
                clearInterval(this.timeinterval);
                this.allowEditFireRate = true;
              }
            } else {
              clearInterval(this.timeinterval);
              this.allowEditFireRate = true;
            }
          }, fireTimeoutSec * 1000);
        } else if (this.fireType === "reportRate") {
          this.timeinterval = setInterval(() => {
            let indexes = [];
            if (this.progress < totalPoints) {
              let firstPointTime = moment(
                this.geojson.features[this.progress > 0 ? this.progress : 0]
                  .properties.time.utc
              );
              for (let i = 0; i < this.geojson.features.length; i++) {
                let f = this.geojson.features[i];
                if (
                  (moment(f.properties.time.utc) >= firstPointTime.clone()) &
                  (moment(f.properties.time.utc) <
                    firstPointTime.clone().add(fireBatchTimeoutSec, "seconds"))
                ) {
                  indexes.push(i);
                }
              }
              //console.log("Total Batch Points: ",indexes.length)
              for (let index of indexes) {
                let feature = this.geojson.features[index];
                let response = locationService.injectLocation(
                  feature,
                  this.masterSerial,
                  this.address,
                  this.progress + 1, 
                  this.showLegacySubjectID? true: false,
                  this.showLegacySubjectID? this.subjectID: null, 
                );

                //console.log("Fire Point:" + JSON.stringify(response));
                this.changeMarkerToGreen(feature.leaflet_id);

                if (this.showMirrorDeviceSerial){
                  let feature2 =  JSON.parse(JSON.stringify(this.geojson.features[totalPoints-index-1]));
                  feature2.properties.time = feature.properties.time
                  let subjectID=null;
                  if (this.showLegacySubjectID)
                  { 
                      subjectID=this.mirrorSubjectID
                  }
                  if (!this.fireTimeoutBetweenDaysTimeHelper){
                    let response = locationService.injectLocation(
                      feature2,
                      this.mirrorSerial,
                      this.address,
                      totalPoints-this.progress+1, 
                      subjectID? true: false,
                      subjectID

                    );
                  }

                  //console.log("Fire Point:" + JSON.stringify(response));
                  this.changeMarkerToOrange(feature2.leaflet_id);
              }

                this.progress = (this.progress+ 1);
                console.log("Fire progress: ", this.progress);
                if (this.progress >= totalPoints) {
                  if (this.advanceTrailOverTime && (this.processAdvanceTrailOverTimeNumOfLoops+1)<=this.advanceTrailOverTimeNumOfLoops){
                    let nextTime = this.lastPointTime[this.lastPointTime.length - 1];
                    nextTime.add(this.deviceSamplingSeconds, 'seconds');
                    console.log("advanceTrailOverTime", nextTime)
                    this.updateDateChangeTrailTimesFrom(nextTime)
                    this.changeTrailTimes()
                    this.progress = 0;
                    this.intervalSum = 0;
                    this.removeAllGreens();
                    this.processAdvanceTrailOverTimeNumOfLoops = this.processAdvanceTrailOverTimeNumOfLoops+1
                    return;
                  }
                  clearInterval(this.timeinterval);
                  this.allowEditFireRate = true;
                }
              }
            } else {
              clearInterval(this.timeinterval);
              this.allowEditFireRate = true;
            }
          }, fireBatchTimeoutSec * 1000);
        }
      }
    },
    createHeading(startLat, startLng, destLat, destLng) {
      startLat = this.toRadians(startLat);
      startLng = this.toRadians(startLng);
      destLat = this.toRadians(destLat);
      destLng = this.toRadians(destLng);

      let y = Math.sin(destLng - startLng) * Math.cos(destLat);
      let x =
        Math.cos(startLat) * Math.sin(destLat) -
        Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
      let brng = Math.atan2(y, x);
      brng = this.toDegrees(brng);
      return (brng + 360) % 360;
    },

    onSerialChange(event) {
      this.masterSerial = event.target.value;
    },
    onMirrorSerialChange(event) {
      this.mirrorSerial = event.target.value;
    },
    onMirrorSubjectIDChange(event) {
      this.mirrorSubjectID = event.target.value;
    },
     onSubjectIDChanged(event) {
      
          this.subjectID = event.target.value;  
     },
    
    async delayDailyPoints(fireTBDSec){
       return new Promise((res) => setTimeout(() => {res('endTimeout')}, fireTBDSec*1000));
       
    },
    async createRandomPointsOnCircle(latlng, radius, groupId) {
      let stopStartTime = moment(this.lastPointTime[groupId]);
      const interval = this.deviceSamplingSeconds;
      console.log("create random points", latlng, radius);
      Swal.fire({
        title: "Points to Area",
        text: "Put your end datetime",
        confirmButtonText: "Continue",
        confirmButtonColor: "#177ddc",
        input: "text",
        inputValue: this.lastPointTime[this.lastPointTime.length - 1].format(
          "YYYY-MM-DD HH:mm:ss"
        ),
        inputPlaceholder: "YYYY-MM-DD HH:mm:ss",
        showCancelButton: true,
      }).then((result1) => {
        if (
          result1.value &&
          result1.value !=
            this.lastPointTime[this.lastPointTime.length - 1].format(
              "YYYY-MM-DD HH:mm:ss"
            )
        ) {
          Swal.fire({
            title: "Points to Area",
            text: "Points type?",
            confirmButtonText: "Movement",
            confirmButtonColor: "#177ddc",
            cancelButtonText: "Stop",
            cancelButtonColor: "#177ddc",
            showCancelButton: true,
          }).then((result2) => {
            console.log("stopEndTIme: " + result1.value);
            const stopEndTime = moment(new Date(result1.value));
            while (stopStartTime < stopEndTime) {
              stopStartTime = stopStartTime.add(interval, "seconds");
              let newLatlng = this.createRandomLatLngInCircle(
                [latlng.lat, latlng.lng],
                radius
              );
              this.addGeoFeature(
                newLatlng.latitude,
                newLatlng.longitude,
                stopStartTime,
                this.speed,
                groupId,
                false,
                null,
                result2.isDismissed,
                null,
                this.LocationMarginError
              );
            }
          });
        }
      });
    },

    async onMapClick(e) {
      this.groupId += 1;
      if (e.shape && e.shape === "Circle") {
        this.createLinePoints(e.marker._latlng, this.groupId);
        this.createRandomPointsOnCircle(
          e.marker._latlng,
          e.marker._radius,
          this.groupId
        );
        this.removeAllGeomanDrawings();
        this.displayDate = moment(
          new Date(
            this.geojson.features[
              this.geojson.features.length - 1
            ].properties.time.utc
          )
        ).format("YYYY-MM-DDTHH:mm:ss");
        return;
      }

      this.createLinePoints(e.marker._latlng, this.groupId);
      this.removeAllGeomanDrawings();
      this.displayDate = moment(
        new Date(
          this.geojson.features[
            this.geojson.features.length - 1
          ].properties.time.utc
        )
      ).format("YYYY-MM-DDTHH:mm:ss");
    },

    createLinePoints(latlng, groupId) {
      if (this.geojson.features.length >= 1) {
        this.inPause = true;

        this.lastfeature =
          this.geojson.features[this.geojson.features.length - 1];
        this.lastPointTime[groupId] = moment(
          new Date(this.lastfeature.properties.time.utc)
        );
        let line = turf.lineString([
          [
            this.lastfeature.geometry.coordinates[0],
            this.lastfeature.geometry.coordinates[1],
          ],
          [latlng.lat, latlng.lng],
        ]);
        let distance = turf.lineDistance(line, { units: "meters" }); //in meters

        let totalPointsNeeded = Math.floor(
          distance / (this.subjectSpeedKMPH / 3.6) / this.deviceSamplingSeconds
        );
        if (totalPointsNeeded > 0) {
          console.log("Multiple Markers");
          let chunks = turf.lineChunk(
            line,
            distance / 1000 / (totalPointsNeeded + 1)
          );
          //don't create first chunk since marker already exist coords[1]
          for (let i = 0; i < chunks.features.length; i++) {
            this.addGeoFeature(
              chunks.features[i].geometry.coordinates[1][0],
              chunks.features[i].geometry.coordinates[1][1],
              this.lastPointTime[groupId].add(
                this.deviceSamplingSeconds,
                "seconds"
              ),
              this.subjectSpeedKMPH,
              groupId,
              i != chunks.features.length - 1,
              null,
              false,
              null,
              this.LocationMarginError
            );
          }
        } else {
          console.log("Single Marker");
          this.addGeoFeature(
            latlng.lat,
            latlng.lng,
            moment(this.lastPointTime[groupId]).add(
              this.deviceSamplingSeconds,
              "seconds"
            ),
            this.subjectSpeedKMPH,
            groupId,
            false,
            false,
            null,
            this.LocationMarginError
          );
        }
      } else {
        console.log("Single Marker");
        this.addGeoFeature(
          latlng.lat,
          latlng.lng,
          moment(this.lastPointTime[groupId]).add(
            this.deviceSamplingSeconds,
            "seconds"
          ),
          this.subjectSpeedKMPH,
          groupId,
          false,
          null,
          false,
          null,
          this.LocationMarginError
        );
      }
    },

    addGeoFeature(
      lat,
      lng,
      currentPointTime,
      speed,
      groupId,
      addRand,
      locationMethodAssign,
      setZero,
      ruleDetails,
      accuracy,
      locationSubMethod = this.locationSubMethod
    ) {
      accuracy = Number(accuracy)
      ruleDetails = ruleDetails ? ruleDetails : this.ruleDetails;
      if (addRand) {
        let newLatlng = this.createRandomLatLngInCircle(
          [lat, lng],
          this.markLocationWithError ? accuracy : 8
        );
        lat = newLatlng.latitude;
        lng = newLatlng.longitude;
      }
      let lastfeature = this.geojson.features[this.geojson.features.length - 1];

      //adjust speed
      if (this.geojson.features.length >= 1) {
        let previousTime = moment(new Date(lastfeature.properties.time.utc));
        let line = turf.lineString([
          [
            lastfeature.geometry.coordinates[0],
            lastfeature.geometry.coordinates[1],
          ],
          [lat, lng],
        ]);
        let distanceFromLastPoint = turf.lineDistance(line, {
          units: "meters",
        }); //in meters
        speed = Math.round(
          distanceFromLastPoint /
            1000 /
            moment.duration(currentPointTime.diff(previousTime)).asHours()
        );
      }

      //create heading
      let heading = 0;
      if (this.geojson.features.length >= 1) {
        heading = Math.floor(
          this.createHeading(
            lastfeature.geometry.coordinates[0],
            lastfeature.geometry.coordinates[1],
            lat,
            lng
          )
        );
      }
      this.lastPointTime[this.groupId] = currentPointTime;

      if (setZero) {
        speed = 0;
        heading = null;
      }

      var blueIcon = new L.Icon({
        iconUrl: movementBlue,
        iconSize: [20, 20],
      });
      var stopblueIcon = new L.Icon({
        iconUrl: stopBlue,
        iconSize: [20, 20],
      });
      var redIcon = new L.Icon({
        iconUrl: movementRed,
        iconSize: [20, 20],
      });
      var stopredIcon = new L.Icon({
        iconUrl: stopRed,
        iconSize: [20, 20],
      });
      //L.geoJSON(this.geojson).addTo(this.map);
      const markerOptions = {
        groupId: groupId,
        time: {
          utc: currentPointTime.toISOString(),
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        speedKMH: speed,
        rotationAngle: heading,
        locationMethod: locationMethodAssign ? locationMethodAssign : this.locationMethod,
        ruleDetails: ruleDetails,
        setZero: setZero,
        accuracy: accuracy,
        ...(locationSubMethod === 'NONE' ? {} : 
        { lbsInfo: {
            "subMethod": locationSubMethod,
            "cellularsNumber": 11,
            "hotspotsNumber": 26,
            "cellularInfo": []
            } 
        })
      };

      //check marker color
      if (heading === null) {
        if (!ruleDetails || Object.keys(ruleDetails).length == 0) {
          markerOptions["icon"] = stopblueIcon;
        } else {
          markerOptions["icon"] = stopredIcon;
        }
      } else {
        if (!ruleDetails || Object.keys(ruleDetails).length == 0) {
          markerOptions["icon"] = blueIcon;
        } else {
          markerOptions["icon"] = redIcon;
        }
      }
      let marker = new L.marker([lat, lng], markerOptions).addTo(this.map);
      marker.setRotationAngle(heading);
      let popup = L.popup({ maxWidth: 800, maxHeight: 200 }).setContent(
        this.convertJson2HTMLTable(markerOptions, [
          "time",
          "locationMethod",
          "ruleDetails",
          "speedKMH",
          "rotationAngle",
          "accuracy"].concat(locationSubMethod==='NONE' ? [] : ['lbsInfo']))
      );
      marker.bindPopup(popup);

      const feature = {
        groupId: groupId,
        leaflet_id: marker._leaflet_id,
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [parseFloat(lat), parseFloat(lng)],
        },
        properties: {
          time: {
            utc: currentPointTime.toISOString(),
            tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          speedKMH: speed,
          heading: heading,
          locationMethod: locationMethodAssign
            ? locationMethodAssign
            : this.locationMethod,
          ruleDetails: ruleDetails,
          setZero: setZero,
          accuracy: accuracy,
          ...(locationSubMethod==='NONE' ? {} : { lbsInfo: {
            "subMethod": locationSubMethod,
            "cellularsNumber": 11,
            "hotspotsNumber": 26,
            "cellularInfo": []
          } })
        },
      };
      this.geojson.features.push(feature);
      //fix first icon heading when second marker arrive
      if (
        this.geojson.features.length == 2 &&
        this.geojson.features[0].properties.setZero != true
      ) {
        this.geojson.features[0].properties.heading = heading;
        let layer = this.map._layers[this.geojson.features[0].leaflet_id];
        layer.setRotationAngle(heading);
      }
    },



    createRandomLatLngInCircle(center, R) {
      center = { latitude: center[0], longitude: center[1] };
      return randomLocation.randomCirclePoint(center, parseInt(R));
    },
    async removeAllGeomanDrawings() {
      this.map.eachLayer(function (layer) {
        if (!layer._url && layer._drawnByGeoman) {
          layer.remove();
        }
      });
    },

    onEnvironementChange(value) {
      this.address = value;
    },
    async goBack() {
      const groupId = this.groupId;
      this.map.eachLayer(function (layer) {
        if (!layer._url && layer.options && layer.options.groupId === groupId) {
          layer.remove();
        }
      });
      this.geojson.features = this.geojson.features.filter((feature) => {
        return feature.groupId != groupId;
      });
      if (groupId > -1) {
        this.groupId = groupId - 1;
      }

      this.lastPointTime = this.lastPointTime.splice(0, this.groupId);
      try {
        this.$nextTick(() => {
          if (this.geojson.features.length > 0) {
            this.displayDate = moment(
              new Date(
                this.geojson.features[
                  this.geojson.features.length - 1
                ].properties.time.utc
              )
            ).format("YYYY-MM-DDTHH:mm:ss");
          }
        });
      } catch (error) {
        console.log(error);
      }
    },
    async changeTrailTimes() {
      const duration = moment.duration(
        this.changeTrailTimeFrom.diff(this.firstPointTime)
      );
      this.geojson.features.forEach((feature) => {
        const timeUTC = moment(new Date(feature.properties.time.utc));
        let newtimeUTC = timeUTC.clone();
        newtimeUTC.add(duration.asSeconds(), "seconds");
        let layer = this.map._layers[feature.leaflet_id];
        layer.options.time = {
          utc: newtimeUTC.toISOString(),
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
        let popup = L.popup({ maxWidth: 800, maxHeight: 200 }).setContent(
          this.convertJson2HTMLTable(layer.options, [
            "time",
            "locationMethod",
            "ruleDetails",
            "speedKMH",
            "rotationAngle",
            "accuracy"
          ])
        );
        layer.bindPopup(popup);
        feature.properties.time = {
          utc: newtimeUTC.toISOString(),
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
      });
      for (const i in this.lastPointTime) {
        let newtimeUTC = this.lastPointTime[i].clone();
        newtimeUTC.add(duration.asSeconds(), "seconds");
        this.lastPointTime[i] = newtimeUTC;
      }
      this.hideTrailTimeChange = true;
    },
    async clearAllPage() {
      document.getElementById("uploadFile").innerHTML = "";
      document.getElementById("uploadFile").inputValue = "";
      document.getElementById("uploadFile").value = "";
      await this.clearAllMarkers();
      this.allowEditFireRate = true;
    },
    async clearAllMarkers() {
      this.map.eachLayer(function (layer) {
        if (!layer._url) {
          layer.remove();
        }
      });
      this.lastfeature = null;
      this.geojson.features = [];
      this.lastPointTime = [moment(new Date())];
      this.$nextTick(() => {
        if (this.geojson.features.length > 0) {
          this.displayDate = moment(
            new Date(
              this.geojson.features[
                this.geojson.features.length - 1
              ].properties.time.utc
            )
          ).format("YYYY-MM-DDTHH:mm:ss");
        }
      });
      this.groupId = -1;
      this.progress = 0;
      this.intervalSum = 0;
    },
    zoomOnLastPoint() {
      if (this.geojson.features.length > 0) {
        let coordinates =
          this.geojson.features[this.geojson.features.length - 1].geometry
            .coordinates;
        this.map.setView(coordinates, this.zoom);
      }
    },
  },
  computed: {
    firstPointTime() {
      return moment(this.geojson.features[0].properties.time.utc) || undefined;
    },
    trailDurationHeader() {
      console.log(this.trailDuration);
      return (
        (this.trailDuration.days() > 0
          ? this.trailDuration.days().toString() +
            (" " + this.trailDuration.days() > 1 ? " Days | " : " Day | ")
          : "") + this.trailDurationClockHeader.toString()
      );
    },
    trailLastPointSentHeader() {
      return moment(this.geojson.features[this.progress].properties.time.utc).toString();
    },
    trailDurationClockHeader() {
      return [
        ("0" + this.trailDuration.hours()).slice(-2),
        ("0" + this.trailDuration.minutes()).slice(-2),
        ("0" + this.trailDuration.seconds()).slice(-2),
      ].join(":");
    },
    trailDuration() {
      if (this.geojson.features.length > 1) {
        return moment.duration(
          moment(
            this.geojson.features[this.geojson.features.length - 1].properties
              .time.utc
          ).diff(moment(this.geojson.features[0].properties.time.utc))
        );
      }
      return moment.duration(0, "minutes");
    },
    trailFromProcessDuration() {
      let firstPointTime = moment(
        this.geojson.features[this.progress > 0 ? this.progress - 1 : 0]
          .properties.time.utc
      );
      return moment.duration(
        moment(
          this.geojson.features[this.geojson.features.length - 1].properties
            .time.utc
        ).diff(firstPointTime)
      );
    },
    changeTrailTimeTo() {
      let changeTrailTimeTo = this.changeTrailTimeFrom.clone();
      return changeTrailTimeTo.add(this.trailDuration.asSeconds(), "seconds");
    },
    progressDetails() {
      let ruleDesc = "";
      if (
        this.geojson.features[this.progress] &&
        this.geojson.features[this.progress].properties?.ruleDetails?.ruleID > 0
      ) {
        const ruleData =
          this.geojson.features[this.progress].properties?.ruleDetails;
        ruleDesc = ` | Rule : ${ruleData.ruleID} - ${ruleData.name}`;
      }

      const progressInPerc = Math.ceil(
        (this.progress * 100) / this.geojson.features.length
      ).toString();

      return `${this.progress.toString()} out of ${this.geojson.features.length.toString()} ( 
        ${progressInPerc}% ) ${ruleDesc}`;
    },
    timeLeftDetails() {
      let date = new Date(null);
      date.setSeconds(
        this.fireType === "pointRate"
          ? this.fireTimeoutSec * (this.geojson.features.length - this.progress)
          : this.trailFromProcessDuration.asSeconds()
      ); // specify value for SECONDS here
      let timeLeftStr = date.toISOString().substr(11, 8);
      return "Time Left: " + timeLeftStr;
    },
    timeLeftDate() {
      if (this.progress<this.geojson.features.length){
        let timeDateStr = moment(this.geojson.features[this.progress].properties.time.utc).format("YYYY-MM-DD HH:mm:ss");
        return "Send Timestamp: " + timeDateStr;
      } else {
        let timeDateStr = moment(this.geojson.features[this.geojson.features.length-1].properties.time.utc).format("YYYY-MM-DD HH:mm:ss");
        return "Send Timestamp: " + timeDateStr;
      }
    },
    timeTimeout() {
      if (this.fireTimeoutBetweenDaysTimeHelper){
        return "Timeout Since: " + this.fireTimeoutBetweenDaysTimeHelper.format("YYYY-MM-DD HH:mm:ss");
      } else {
        return "";
      }
    },
  },
  beforeRouteLeave(to, from, next) {
    if (this.geojson.features.length > 0) {
      const answer = window.confirm(
        "Do you really want to leave?! Data will be deteted!"
      );
      if (answer) {
        next();
      } else {
        next(false);
      }
    } else {
      next();
    }
  },
};
</script>

<style scoped>
.buttonsLineSeperator {
  height: 5px;
}
.singleInput {
  margin-bottom: 12px;
}
.singleInputTotal {
  margin-bottom: 25px;
  display: table;
  margin: 0 auto;
  font-size: 20px;
}

.singleInputHeader {
  color: white;
  font-weight: normal;
  padding-right: 5px;
  padding-bottom:3px !important;
}
.inputContainer {
  flex-direction: row;
  color: white;
  flex: 0 0 22em;
  margin-top: 5.5vh;
}
#mapContainer {
  width: 100vw;
  height: 82vh;
}
.mapWrapper {
  margin: 10px;
  display: flex;
}
.ant-input {
  width: 250px;
}
.buttonClass {
  background-color: #7065e0;
  border: none;
  border-radius: 5px;
  color: #333; /* Dark grey */
  padding: 10px 20px;
  margin-right: 5px;
  margin-top: 5px;
}
.freeJson {
  border: groove;
  width: 25vw;
  height: 82vh;
  overflow-y: scroll;
}
#tooltip {
  border: 1px solid white;
  padding: 5px;
  position: absolute;
  background-color: black;
  z-index: 100000;
  overflow: scroll;
  max-height: 500px;
}
.progressTitle {
  font-size: 20px;
  color: white;
}

#map-area {
  display: flex;
  flex-flow: column;
  max-width: 80%;
}
#map-tools {
  margin-bottom: 20px;
}
#env-input {
  z-index: 20;
}

.mapControlContainer,
.subjectContainer {
  padding-bottom: 0px;
  padding-left: 28px;
  padding-top: 8px;
  border: 1px solid;
  border-color: white;
  border-radius: 4px;
  width: 300px;
  margin-bottom: 10px;
  margin-right: 8px;
}
.selectLocationMethod {
  width: 250px;
}
</style>
