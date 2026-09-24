// Builds used-vehicle search links for the major listing sites, centered on
// North Haven, CT. Shared by the server and (inlined by artifact/build.js) the
// claude.ai page, so keep it dependency-free.
'use strict';

function usedListingLinks(input) {
  const make = String(input.make || '').trim();
  const model = String(input.model || '').trim();
  if (!make || !model) throw new Error('make and model are required, e.g. {"make":"Lincoln","model":"Aviator"}');
  const zip = /^\d{5}$/.test(String(input.zip || '')) ? String(input.zip) : '06473';
  const radius = Math.min(500, Math.max(25, Math.round(Number(input.radius_miles) || 150)));
  const num = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Math.round(Number(v)) : null);
  const yearMin = num(input.year_min), yearMax = num(input.year_max), maxMiles = num(input.max_miles), maxPrice = num(input.max_price);
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const kebab = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const makeSlug = slug(make);

  const carsCom = (stock) => {
    const q = new URLSearchParams({ stock_type: stock, zip, maximum_distance: String(radius), sort: 'best_deal' });
    q.append('makes[]', makeSlug);
    q.append('models[]', `${makeSlug}-${slug(model)}`);
    if (yearMin) q.set('year_min', String(yearMin));
    if (yearMax) q.set('year_max', String(yearMax));
    if (maxMiles) q.set('mileage_max', String(maxMiles));
    if (maxPrice) q.set('list_price_max', String(maxPrice));
    return `https://www.cars.com/shopping/results/?${q}`;
  };
  const edmunds = new URLSearchParams({ make: kebab(make), model: kebab(model), inventorytype: 'used', radius: String(radius), zip });
  if (yearMin) edmunds.set('year', `${yearMin}-${yearMax || new Date().getFullYear() + 1}`);

  return {
    search: { make, model, zip, radius_miles: radius, year_min: yearMin, year_max: yearMax, max_miles: maxMiles, max_price: maxPrice },
    links: [
      { site: 'Cars.com (used, sorted by best deal, shows deal rating)', url: carsCom('used') },
      { site: 'Cars.com (certified pre-owned only)', url: carsCom('cpo') },
      { site: 'Edmunds (used, shows market price comparison)', url: `https://www.edmunds.com/inventory/srp.html?${edmunds}` },
      { site: 'Autotrader', url: `https://www.autotrader.com/cars-for-sale/used-cars/${kebab(make)}/${kebab(model)}/north-haven-ct?searchRadius=${radius}` },
      { site: 'CarMax (nationwide, transfers to CT stores)', url: `https://www.carmax.com/cars/${kebab(make)}/${kebab(model)}` },
      { site: 'Carvana (delivered)', url: `https://www.carvana.com/cars/${kebab(make)}-${kebab(model)}` },
    ],
    also_check: 'CarGurus (search the model near 06473 and read its deal rating against market value), the local franchise dealer\'s used/CPO page, and wholesale auctions (Manheim/ADESA) through a dealer partner for multi-unit buys.',
  };
}

if (typeof module !== 'undefined') module.exports = { usedListingLinks };
