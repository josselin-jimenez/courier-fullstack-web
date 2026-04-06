const { Client } = require("@googlemaps/google-maps-services-js");
const googleMapsClient = new Client({});

// ─── GEOCODE ──────────────────────────────────────────────────────────────────
// Converts an address into { lat, lng } coordinates
// Uses postal code + country if available, falls back to city + state + country
const geocode = async (city, state, country, postalCode) => {
  const address = postalCode
    ? `${postalCode}, ${country}`
    : `${city}, ${state}, ${country}`;

  const response = await googleMapsClient.geocode({
    params: {
      address,
      key: process.env.GOOGLE_MAPS_API_KEY,
    }
  });

  if (response.data.status !== "OK" || response.data.results.length === 0) {
    throw new Error(`Could not geocode address: ${address}`);
  }

  const { lat, lng } = response.data.results[0].geometry.location;
  return { lat, lng };
};

// ─── HAVERSINE ────────────────────────────────────────────────────────────────
// Calculates straight-line distance in miles between two lat/lng points
const haversine = (lat1, lng1, lat2, lng2) => {
  const R    = 3958.8; // Earth's radius in miles
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── GET DISTANCE ─────────────────────────────────────────────────────────────
// Geocodes both addresses then returns straight-line distance in miles
const getDistance = async (origin, destination) => {
  const [o, d] = await Promise.all([
    geocode(origin.city, origin.state, origin.country, origin.postalCode),
    geocode(destination.city, destination.state, destination.country, destination.postalCode),
  ]);

  return haversine(o.lat, o.lng, d.lat, d.lng);
};

// ─── CALCULATE COST ─────────────────────────────────────────────────────────────
// returns cost of shipment
const calculateCost = async ({ origin, originIsMilitary, destination, destinationIsMilitary, selectedServices, shippingRateMap, packages }) => {

    // Services base cost total
    const serviceBaseCost = selectedServices.reduce((sum, s) => sum + parseFloat(s.base_cost), 0);

    // Insurance cost if chosen
    const totalPkgValue = packages.reduce((sum, pkg) => sum + parseFloat(pkg.value || 0), 0); // 0 if no insurance chosen
    const insurance = selectedServices.find(s => s.service_name === "Insurance");
    const insuranceValueCost = insurance
    ? totalPkgValue * shippingRateMap.insurance
    : 0;

    // Billable weight
    const totalWeight    = packages.reduce((sum, pkg) => sum + pkg.weight, 0);
    const totalDimWeight = packages.reduce((sum, pkg) => sum + (pkg.length * pkg.width * pkg.height) / 139, 0);
    const billableWeight = Math.max(totalWeight, totalDimWeight);

    // If not military, check distance
    const isMilitary = originIsMilitary || destinationIsMilitary || selectedServices.some(s => s.service_name.startsWith("Military"));
    const distanceMiles = isMilitary ? 0 : await getDistance(origin, destination);

    const numPackages = packages.length;

    console.log(packages);
    console.log({ serviceBaseCost, insuranceValueCost, numPackages, handling_fee: shippingRateMap.handling_fee, billableWeight, weight: shippingRateMap.weight, distanceMiles, distance: shippingRateMap.distance });

    return serviceBaseCost + insuranceValueCost + (numPackages * shippingRateMap.handling_fee) + 
            (billableWeight * shippingRateMap.weight) + (distanceMiles * shippingRateMap.distance);
    
};

module.exports = { calculateCost };
