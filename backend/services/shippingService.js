// shippingService: Logic behind calculating shipping amount

// ─── HAVERSINE ────────────────────────────────────────────────────────────────
// Calculates straight-line distance in miles between two lat/lng points
const haversine = (lat1, lng1, lat2, lng2) => {
  const R     = 3958.8; // Earth's radius in miles
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── CALCULATE COST ──────────────────────────────────────────────────────────
// Accepts pre-validated coordinates from the controller
// originCoords/destinationCoords are { lat, lng } or null for military
const calculateCost = async ({ originCoords, destinationCoords, selectedServices, shippingRateMap, packages }) => {

    // Services base cost total
    const serviceBaseCost = selectedServices.reduce((sum, s) => sum + parseFloat(s.base_cost), 0);

    // Insurance cost if chosen
    // Adds all package values and multiplies them by the insurance service rate
    const totalPkgValue = packages.reduce((sum, pkg) => sum + parseFloat(pkg.value || 0), 0); // 0 if no insurance chosen
    const insurance = selectedServices.find(s => s.service_name === "Insurance");
    const insuranceValueCost = insurance
        ? totalPkgValue * shippingRateMap.insurance
        : 0;

    // Billable weight
    // Choose the max between the package's physical weight vs. dimensional weight
    const totalWeight    = packages.reduce((sum, pkg) => sum + parseFloat(pkg.weight), 0);
    // 139 DIM divisor used by FedEx & UPS
    const totalDimWeight = packages.reduce((sum, pkg) => sum + (parseFloat(pkg.length) * parseFloat(pkg.width) * parseFloat(pkg.height)) / 139, 0);
    const billableWeight = Math.max(totalWeight, totalDimWeight);
    const weightCost     = billableWeight * shippingRateMap.weight;

    // Packages get charged a distance rate using pre-validated coords
    const distanceMiles = haversine(originCoords.lat, originCoords.lng, destinationCoords.lat, destinationCoords.lng);
    const distanceCost  = distanceMiles * shippingRateMap.distance;

    // Handling fee charged per package in shipment
    const numPackages = packages.length;
    const handlingCost = numPackages * shippingRateMap.handling_fee;

    const totalCost = serviceBaseCost + insuranceValueCost + handlingCost + weightCost + distanceCost;

    return totalCost;
};

module.exports = { calculateCost };
