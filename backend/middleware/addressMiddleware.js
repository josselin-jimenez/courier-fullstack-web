// Address Middleware: Contains address validation
// If address not valid, error is returned
// If address is valid, returns geocode
// Ensured correct validation for supported countries
// Not so ensured for unsupported countries
const { Client } = require("@googlemaps/google-maps-services-js");
const googleMapsClient = new Client({});

// Countries supported by Google Address Validation API
const VALIDATION_SUPPORTED_COUNTRIES = new Set([
  "AR","AT","AU","BE","BG","BR","CA","CH","CL","CO","CZ","DE","DK",
  "EE","ES","FI","FR","GB","HR","HU","IE","IN","IT","JP","LT","LU",
  "LV","MX","MY","NL","NO","NZ","PL","PR","PT","SE","SG","SI","SK","US"
]);

const UNIT_RE = /^[A-Za-z0-9 .#/,-]{1,50}$/;
// ─── GOOGLE ADDRESS VALIDATION API ───────────────────────────────────────────
// Used for countries supported by Google Address Validation API
const validateAndGeocode = async (streetAddr, unit, city, state, country, postalCode) => {
  const addressLines = unit ? [streetAddr, unit] : [streetAddr];

  const response = await fetch(
    `https://addressvalidation.googleapis.com/v1:validateAddress?key=${process.env.GOOGLE_MAPS_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: {
          regionCode: country,
          administrativeArea: state,
          locality: city,
          postalCode: postalCode,
          addressLines
        }
      })
    }
  );

  const data = await response.json();
  //console.log("Address Validation response:", JSON.stringify(data, null, 2));
  const result = data.result;

  if (!result) {
    throw new Error(`Could not validate address: ${streetAddr}, ${city}, ${state}`);
  }

  const { validationGranularity } = result.verdict;
  const { unconfirmedComponentTypes } = result.address;

  const preciseEnough = ["SUB_PREMISE", "PREMISE", "PREMISE_PROXIMITY"].includes(validationGranularity);
  if (!preciseEnough) {
    throw new Error(`Address not precise enough: ${streetAddr}, ${city}, ${state}`);
  }

  const CRITICAL_COMPONENTS = new Set(["street_number", "route", "postal_code"]);
  const criticalUnconfirmed = unconfirmedComponentTypes?.filter(c => CRITICAL_COMPONENTS.has(c)) ?? [];
  if (criticalUnconfirmed.length > 0) {
    throw new Error(`Unconfirmed address components: ${criticalUnconfirmed.join(", ")}`);
  }

  const { latitude, longitude } = result.geocode.location;
  return { lat: latitude, lng: longitude };
};

// ─── GOOGLE GEOCODING API ─────────────────────────────────────────────────────
// Fallback for countries not supported by Address Validation API
const geocodeOnly = async (streetAddr, unit, city, state, country, postalCode) => {
  const address = unit
    ? `${streetAddr} ${unit}, ${city}, ${state}, ${postalCode}, ${country}`
    : `${streetAddr}, ${city}, ${state}, ${postalCode}, ${country}`;

  const response = await googleMapsClient.geocode({
    params: { address, key: process.env.GOOGLE_MAPS_API_KEY }
  });
  //console.log("Geocode response:", JSON.stringify(response.data, null, 2));
  if (response.data.status !== "OK" || response.data.results.length === 0) {
    throw new Error(`Could not geocode address: ${address}`);
  }

  const result = response.data.results[0];
  const locationType = result.geometry.location_type;

  if (locationType === "GEOMETRIC_CENTER" || locationType === "APPROXIMATE") {
    throw new Error(`Address not precise enough: ${address}`);
  }

  const { lat, lng } = result.geometry.location;
  return { lat, lng };
};

// ─── VALIDATE ADDRESS ─────────────────────────────────────────────────────────
// Validates an address and returns { lat, lng }
// Routes to Address Validation API or Geocoding API based on country support
// Does NOT handle military logic — callers decide whether to invoke this
const validateAddress = ({ streetAddr, unit, city, state, country, postalCode }) => {
  if (unit && !UNIT_RE.test(unit)) {
    throw new Error(`Invalid Address Line 2 format. Try Again.`)
  }
  if (VALIDATION_SUPPORTED_COUNTRIES.has(country)) {
    return validateAndGeocode(streetAddr, unit, city, state, country, postalCode);
  }
  return geocodeOnly(streetAddr, unit, city, state, country, postalCode);
};


module.exports = { validateAddress };
