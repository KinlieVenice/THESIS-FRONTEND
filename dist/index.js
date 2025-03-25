const url = "http://192.168.68.116:5000";
let selectedGroup = document.getElementById("sortGroup").value;
let openedId = 0;
let map = L.map("map").setView([14.205, 120.885], 17);
let currentPopup = null; // Track the currently open popup
let firstPopupOpened = false; // Ensure only the first marker opens a popup

const yellowIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// let markerData = {
//   assessments: [
//     {
//       end_coor: [14.2984189, 121.0522294],
//       id: 3,
//       start_coor: [14.2984189, 121.0522294],
//     },
//     {
//       end_coor: [14.3219259, 121.0621044],
//       id: 6,
//       start_coor: [14.3219259, 121.0621044],
//     },
//     {
//       end_coor: [14.3219259, 121.0621044],
//       id: 20,
//       start_coor: [14.3219259, 121.0621044],
//     },
//     {
//       end_coor: [14.3219259, 121.0621044],
//       id: 30,
//       start_coor: [14.3219259, 121.0621044],
//     },
//     {
//       end_coor: [14.3219259, 121.0621044],
//       id: 40,
//       start_coor: [14.3219259, 121.0621044],
//     },
//     {
//       end_coor: [14.2042025, 120.8607875],
//       id: 4,
//       start_coor: [14.2042025, 120.8607875],
//     },
//     {
//       end_coor: [14.2225073, 120.8425914],
//       id: 5,
//       start_coor: [14.2225073, 120.8425914],
//     },
//     {
//       end_coor: [14.2225073, 120.8425914],
//       id: 29,
//       start_coor: [14.2225073, 120.8425915],
//     },
//     {
//       end_coor: [14.2225073, 120.8425914],
//       id: 39,
//       start_coor: [14.2225073, 120.8425915],
//     },
//     {
//       end_coor: [14.2225073, 120.8425914],
//       id: 49,
//       start_coor: [14.2225073, 120.8425915],
//     },
//   ],
// };

// let markerData = {
//   Indang: [
//     {
//       end_coor: [-14.6325006, 121.9502079],
//       id: 1,
//       start_coor: [-14.5995264, 120.9842123],
//       cracks: [
//         {
//           type: "Transverse Crack222",
//           severity: "High",
//           recommendedSolution: "Seal with hot mix asphalt.",
//         },
//         {
//           type: "Transverse Crack",
//           severity: "High",
//           recommendedSolution: "Seal with hot mix asphalt.",
//         },
//         {
//           type: "Transverse Crack",
//           severity: "High",
//           recommendedSolution: "Seal with hot mix asphalt.",
//         },
//       ],
//     },
//   ],
// };

let assessGroup = {};

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

const fetchGroup = async (param, relation = "") => {
  try {
    let link = `${url}/group/${param}`;

    if (relation === "") {
      link = `${url}/group/${param}`;
    } else {
      link = `${url}/group/${param}/${relation}`;
    }

    const response = await fetch(link, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Fetched group:", data);
    return data;
  } catch (error) {
    console.error("Error fetching group:", error);
    return [];
  }
};

const fetchCracks = async (assessID) => {
  try {
    let link = `${url}/assessment/${assessID}/cracks`;

    const response = await fetch(link, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Fetched crack:", data);
    return data;
  } catch (error) {
    console.error("Error fetching crack:", error);
    return [];
  }
};

const displayGroupLevel = async (param) => {
  let groupNames = document.getElementById("groupNames");

  let groupLevels = await fetchGroup(param);
  console.log("Hello:", groupLevels);

  groupNames.innerHTML = "";

  for (let groupLevel of groupLevels) {
    groupNames.innerHTML += `
        <div id="group-${groupLevel.id}">
            <span class="pin_loc bg-primary flex gap-1 items-center py-4 allindent cursor-pointer border-y-[1px]" id="toggle-${groupLevel.id}" onclick="displayGroupDetails(${groupLevel.id})">
                <img src="/img/pin-loc.png" alt="" />
                <p id="grpname-${groupLevel.id}">${groupLevel.name}</p>
            </span>
        </div>`;

    const assess = await fetchGroup(groupLevel.id, "assessments");
    const key = `groupAss-${groupLevel.id}`;
    assessGroup[key] = assess.assessments;
    addMarker(assessGroup[key]);
  }

  displayGroupDetails(groupLevels[0].id);
};

const groupSorting = () => {
  selectedGroup = document.getElementById("sortGroup").value;
  displayGroupLevel(selectedGroup);
};

const displayGroupDetails = async (ID) => {
  let groupNames = document.getElementById(`group-${ID}`);
  const key = `groupAss-${ID}`;

  if (openedId !== ID) {
    let openedGroup = document.getElementById(`details-${openedId}`);

    if (openedGroup) {
      openedGroup.remove();
      removeMarker(assessGroup[`groupAss-${openedId}`]);
      addMarker(assessGroup[`groupAss-${openedId}`], openedId);
    }
    openedId = ID;

    const details = await fetchGroup(ID);
    const assess = await fetchGroup(ID, "assessments");

    removeMarker(assessGroup[key]);

    assessGroup[key] = assess.assessments;
    addMarker(assessGroup[key], ID, "yellow");

    const coords = [];
    assessGroup[key].forEach((ass) => {
      coords.push(ass.start_coor);
    });

    groupNames.innerHTML += `
            <div class="summaryDetailed" id="details-${ID}">
                <p class="font-bold detailed-info">Detailed Information</p>
                <div class="detailed-info">
                    <span class="flex gap-[15px] items-center">
                    <img src="/img/length.png" alt="" />
                    <p class="font-bold">Length of Road Monitored:</p>
                    </span>
                    <p class="pl-[56px]">${details.n_assess * 5} meters</p>
                </div>
                <div class="detailed-info">
                    <span class="flex gap-[15px] items-center">
                    <img src="/img/lanes.png" alt="" />
                    <p class="font-bold">Number of Assessments:</p>
                    </span>
                    <p class="pl-[56px]">${details.n_assess} assessments</p>
                </div>
                <div class="detailed-info">
                    <span class="flex gap-[15px] items-center">
                    <img src="/img/cracks-detected.png" alt="" />
                    <p class="font-bold">Types of Cracks Detected:</p>
                    </span>
                    <span class="grid gap-2">
                    <p class="pl-[56px]">Transverse Cracks (${
                      details.n_cracks.trans
                    })</p>
                    <p class="pl-[56px]">Longitudinal Cracks (${
                      details.n_cracks.longi
                    })</p>
                    <p class="pl-[56px]">Multiple Cracks (${
                      details.n_cracks.multi
                    })</p>
                    </span>
                </div>
                <div class="detailed-info">
                    <span class="flex gap-[15px] items-center">
                    <img src="/img/total-crack.png" alt="" />
                    <p class="font-bold">Total Number of Cracks:</p>
                    </span>
                    <p class="pl-[56px]">${
                      details.n_cracks.trans +
                      details.n_cracks.longi +
                      details.n_cracks.multi
                    }  cracks</p>
                </div>
                <div class="detailed-info">
                    <span class="flex gap-[15px] items-center">
                    <img src="/img/date.png" alt="" />
                    <p class="font-bold">Date Last Updated:</p>
                    </span>
                    <p class="pl-[56px]">${details.date}</p>
                </div>
            </div>`;

    let expanded = document.getElementById(`toggle-${ID}`);
    let sumDetails = document.getElementById(`details-${ID}`);
    sumDetails.classList.add("open");

    expanded.addEventListener("click", () => {
      sumDetails.classList.toggle("open");
    });

    zoomToPoints(coords);
  } else {
    let track = document.getElementById(`details-${ID}`);

    if (!track.classList.contains("open")) {
      const coords = [];
      assessGroup[key].forEach((ass) => {
        coords.push(ass.start_coor);
      });
      zoomToPoints(coords);
      removeMarker(assessGroup[key]);
      addMarker(assessGroup[key], ID, "yellow");
    } else {
      const allCoords = Object.values(assessGroup).flatMap((group) =>
        group.map((item) => item.start_coor)
      );
      zoomToPoints(allCoords);
      removeMarker(assessGroup[key]);
      addMarker(assessGroup[key], ID);
    }
  }
};

// // Function to dynamically add markers and bind click events
// const addMarkers = async (ID) => {
//   let markers = []; // Array to store marker objects
//   let pins = await fetchGroup(ID, "assessments");

//   // Iterate through all cities

//   pins.assessments.forEach((coordinates) => {
//     // Create marker for each set of coordinates
//     let marker = L.marker(coordinates.start_coor).addTo(map);
//     markers.push(marker);

//     // Add click event to update the info panel
//     marker.on("click", (e) => {
//       e.originalEvent.stopPropagation(); // Prevent map click event from firing
//       displayMultipleCracks(coordinates.cracks); // Handle multiple cracks
//       document.getElementById("crack").classList.remove("-translate-x-full");
//       document.getElementById("crack").style.left = "0";
//     });
//   });

//   // Adjust map view to include all markers
//   let markerBounds = L.latLngBounds(
//     markers.map((marker) => marker.getLatLng())
//   );
//   map.fitBounds(markerBounds); // Fit the map to the bounds of all markers
// };

const addMarker = async (coords, groupID, color = "") => {
  const infoPanel = document.querySelector("#crack-details");

  let assessIndex = 0
  coords.forEach((coor) => {
    assessIndex++
    const coors = coor.start_coor;
    let marker;
    if (color) marker = L.marker(coors, { icon: yellowIcon }).addTo(map);
    // Opens popup by default;
    else marker = L.marker(coors).addTo(map); // Opens popup by default;

    // Bind popup once, but don't open it yet
    marker.bindPopup(`Assessment ${assessIndex}`, { closeButton: false });

    // Click event for opening the popup and showing crack details
    marker.on("click", async (e) => {
      e.originalEvent.stopPropagation();

      if (currentPopup) {
        map.closePopup(currentPopup); // Close previous popup
      }

      marker.openPopup(); // Open new popup
      currentPopup = marker.getPopup(); // Store the opened popup

      // Fetch and display crack details
      let grpNameElement = document.getElementById(`grpname-${groupID}`);
      let grpName = grpNameElement ? grpNameElement.innerHTML : "Unknown Group";

      let lat = coors[0] < 0 ? "S" : "N";
      let lon = coors[1] < 0 ? "E" : "W";

      document.getElementById(
        "coordinates"
      ).innerHTML = `${coors[0]} ${lat}, ${coors[1]} ${lon}`;
      document.getElementById("group").innerHTML = grpName;

      let crackDetails = await fetchCracks(coor.id);
      let index = 0;
      infoPanel.innerHTML = ""; // Clear existing content

      crackDetails.cracks.forEach((crack) => {
        index++;

        let sol =
          crack.crack_type === "longitudinal" ||
          crack.crack_type === "transverse"
            ? "Asphalt"
            : "Reblock";

        infoPanel.innerHTML += `
          <div class="crack-info grid gap-2">
            <h3 class="font-bold">Crack ${index}:</h3>
            <p><span class="font-bold">Type: </span>${crack.crack_type}</p>
            <p><span class="font-bold">Severity: </span>${crack.crack_severity}</p>
            <p><span class="font-bold">Recommended Solution: </span>${sol}</p>
          </div>
        `;
      });

      document.getElementById("crack").classList.remove("-translate-x-full");
      document.getElementById("crack").style.left = "0";
    });

    // Ensure only the first marker in the **entire session** opens its popup
    if (!firstPopupOpened) {
      marker.openPopup();
      currentPopup = marker.getPopup();
      firstPopupOpened = true;
    }
  });
};
const removeMarker = (coords) => {
  coords.forEach((coor) => {
    const [lat, lng] = coor.start_coor; // Extract lat & lng from array

    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        let markerLatLng = layer.getLatLng();
        if (markerLatLng.lat === lat && markerLatLng.lng === lng) {
          map.removeLayer(layer);
        }
      }
    });
  });
};

// Function to zoom to bounds covering all coordinates
function zoomToPoints(coords) {
  const bounds = L.latLngBounds(coords);
  map.fitBounds(bounds, { padding: [50, 50] });
}

// Function to handle multiple cracks
function displayMultipleCracks(cracks) {
  const infoPanel = document.querySelector("#crack-details");
  infoPanel.innerHTML = ""; // Clear existing content

  cracks.forEach((crack, index) => {
    infoPanel.innerHTML += `
      <div class="crack-info grid gap-2">
        <h3 class="font-bold">Crack ${index + 1}:</h3>
        <p><span class="font-bold">Type: </span>${crack.type}</p>
        <p><span class="font-bold">Severity: </span>${crack.severity}</p>
        <p><span class="font-bold">Recommended Solution: </span>${
          crack.recommendedSolution
        }</p>
      </div>
    `;
  });
}

map.on("click", () => {
  document.getElementById("crack").style.left = "-100%";
});

// Add markers to the map

displayGroupLevel(selectedGroup);
