/**
 * Electrical Wiring Assistant - Core Logic (with Pune INR Pricing)
 */

const AppState = {
  rooms: []
};

// Pune Pricing Data (per meter)
const PRICING = {
  copper: {
    "1.5 sq.mm.": 20,
    "2.5 sq.mm.": 32,
    "4.0 sq.mm.": 50,
    "6.0 sq.mm.": 75,
    "10.0 sq.mm.": 130,
    "16.0 sq.mm.": 200
  },
  laborPerMeter: 15
};

/**
 * Generates the UI for room inputs based on user selection
 */
function generateRoomInputs() {
  const numRoomsInput = document.getElementById("numRooms");
  const numRooms = parseInt(numRoomsInput.value);
  
  if (isNaN(numRooms) || numRooms < 1) {
    alert("Please enter a valid number of rooms.");
    return;
  }

  const container = document.getElementById("roomsContainer");
  container.innerHTML = ""; // Reset
  AppState.rooms = [];

  for (let i = 1; i <= numRooms; i++) {
    const room = { id: i, appliances: [{ id: 1 }] };
    AppState.rooms.push(room);
    
    const roomHTML = `
      <div class="room-box" id="room-card-${i}">
        <div class="room-header">
          <h3>Room ${i}</h3>
          <div class="appliance-input">
            <label>Cable Length (m)</label>
            <input type="number" id="room-length-${i}" value="10" style="max-width: 80px;" />
          </div>
        </div>
        <div id="appliances-container-${i}">
          ${createApplianceRow(i, 1)}
        </div>
        <div class="room-footer">
          <button class="secondary" onclick="addAppliance(${i})">
            <span>+ Add Appliance</span>
          </button>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', roomHTML);
  }
}

/**
 * Creates HTML for a single appliance input row
 */
function createApplianceRow(roomNum, applianceId) {
  return `
    <div class="appliance-row" id="room-${roomNum}-appliance-${applianceId}">
      <div class="appliance-input">
        <label>Appliance Name</label>
        <input type="text" data-type="name" placeholder="e.g. Fan" />
      </div>
      <div class="appliance-input">
        <label>Wattage (W)</label>
        <input type="number" data-type="watt" placeholder="80" />
      </div>
      <div class="appliance-input">
        <label>Qty</label>
        <input type="number" data-type="qty" value="1" />
      </div>
    </div>
  `;
}

/**
 * Adds a new appliance row to a specific room
 */
function addAppliance(roomNum) {
  const room = AppState.rooms.find(r => r.id === roomNum);
  const newId = room.appliances.length + 1;
  room.appliances.push({ id: newId });

  const container = document.getElementById(`appliances-container-${roomNum}`);
  container.insertAdjacentHTML('beforeend', createApplianceRow(roomNum, newId));
}

/**
 * Main calculation logic
 */
function calculateLoad() {
  let totalWatts = 0;
  let totalMaterialCost = 0;
  let totalLaborCost = 0;

  let resultsHTML = `
    <div class="output-box">
      <h2>Calculation & Cost Analysis</h2>
  `;

  AppState.rooms.forEach(room => {
    let roomWatts = 0;
    const roomDiv = document.getElementById(`room-card-${room.id}`);
    const length = parseFloat(document.getElementById(`room-length-${room.id}`).value) || 0;
    const rows = roomDiv.querySelectorAll('.appliance-row');

    rows.forEach(row => {
      const watt = parseFloat(row.querySelector('input[data-type="watt"]').value) || 0;
      const qty = parseInt(row.querySelector('input[data-type="qty"]').value) || 0;
      roomWatts += (watt * qty);
    });

    const roomCurrent = roomWatts / 230;
    const recommendedWire = suggestWireSize(roomCurrent);
    
    // Cost calculation per room
    const pricePerMeter = PRICING.copper[recommendedWire] || 0;
    const materialCost = pricePerMeter * length;
    const laborCost = PRICING.laborPerMeter * length;

    totalWatts += roomWatts;
    totalMaterialCost += materialCost;
    totalLaborCost += laborCost;

    resultsHTML += `
      <div class="result-row">
        <span>Room ${room.id} (${roomWatts}W / ${length}m)</span>
        <strong>Wire: ${recommendedWire}</strong>
      </div>
      <div class="result-row cost-row">
        <span>Est. Material Cost (INR)</span>
        <strong>₹${materialCost.toLocaleString()}</strong>
      </div>
      <div class="divider" style="margin: 1rem 0; opacity: 0.3;"></div>
    `;
  });

  const totalCurrent = totalWatts / 230;
  const grandTotal = totalMaterialCost + totalLaborCost;

  resultsHTML += `
      <div class="result-row">
        <span>Total Load</span>
        <strong>${totalWatts.toLocaleString()} W</strong>
      </div>
      <div class="result-row">
        <span>Total Current (@230V)</span>
        <strong>${totalCurrent.toFixed(2)} A</strong>
      </div>
      
      <div class="cost-summary">
        <div class="result-row">
          <span>Total Material Cost</span>
          <strong>₹${totalMaterialCost.toLocaleString()}</strong>
        </div>
        <div class="result-row">
          <span>Total Labor Cost (@₹15/m)</span>
          <strong>₹${totalLaborCost.toLocaleString()}</strong>
        </div>
        <div class="divider"></div>
        <div class="result-row">
          <strong>Grand Total (Estimated)</strong>
          <span class="total-cost">₹${grandTotal.toLocaleString()}</span>
        </div>
      </div>
      
      <p style="margin-top: 1rem; color: var(--text-muted); font-size: 0.875rem;">
        * Note: Prices are based on average retail rates in Pune, Maharashtra.
      </p>
    </div>
  `;

  document.getElementById("output").innerHTML = resultsHTML;
  document.getElementById("output").scrollIntoView({ behavior: 'smooth' });
}

/**
 * Suggests wire size based on current capacity
 */
function suggestWireSize(amps) {
  if (amps === 0) return "N/A";
  if (amps <= 12) return "1.5 sq.mm.";
  if (amps <= 18) return "2.5 sq.mm.";
  if (amps <= 24) return "4.0 sq.mm.";
  if (amps <= 32) return "6.0 sq.mm.";
  if (amps <= 45) return "10.0 sq.mm.";
  return "16.0 sq.mm.";
}
