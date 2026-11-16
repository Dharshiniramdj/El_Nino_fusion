/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface EnsoImpactRecord {
  year: number;
  season: string;
  ensoType: "VSE" | "SE" | "ME" | "WE" | "N" | "WL" | "ML" | "SL";
  peakOni: number;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  temperatureAnomaly: number;
  rainfallAnomaly: number;
  impactCategory: string;
  impactDescription: string;
  severity: "Low" | "Moderate" | "High" | "Extreme";
}

// Map years to historical ENSO state
export const HISTORICAL_ENSO_STATES: Record<number, { type: "VSE" | "SE" | "ME" | "WE" | "N" | "WL" | "ML" | "SL"; oni: number; season: string }> = {
  1950: { type: "WL", oni: -0.82, season: "1950-1951" },
  1951: { type: "ME", oni: 1.15, season: "1951-1952" },
  1952: { type: "N", oni: -0.16, season: "1952-1953" },
  1953: { type: "WE", oni: 0.64, season: "1953-1954" },
  1954: { type: "WL", oni: -0.73, season: "1954-1955" },
  1955: { type: "ML", oni: -1.27, season: "1955-1956" },
  1956: { type: "SL", oni: -1.68, season: "1956-1957" },
  1957: { type: "VSE", oni: 2.12, season: "1957-1958" },
  1958: { type: "WE", oni: 0.58, season: "1958-1959" },
  1959: { type: "N", oni: 0.05, season: "1959-1960" },
  1960: { type: "N", oni: -0.21, season: "1960-1961" },
  1961: { type: "N", oni: -0.12, season: "1961-1962" },
  1962: { type: "N", oni: -0.24, season: "1962-1963" },
  1963: { type: "ME", oni: 1.22, season: "1963-1964" },
  1964: { type: "WL", oni: -0.78, season: "1964-1965" },
  1965: { type: "SE", oni: 1.76, season: "1965-1966" },
  1966: { type: "N", oni: -0.08, season: "1966-1967" },
  1967: { type: "N", oni: -0.34, season: "1967-1968" },
  1968: { type: "ME", oni: 1.08, season: "1968-1969" },
  1969: { type: "WE", oni: 0.74, season: "1969-1970" },
  1970: { type: "ML", oni: -1.12, season: "1970-1971" },
  1971: { type: "WL", oni: -0.85, season: "1971-1972" },
  1972: { type: "VSE", oni: 2.05, season: "1972-1973" },
  1973: { type: "SL", oni: -1.84, season: "1973-1974" },
  1974: { type: "WL", oni: -0.92, season: "1974-1975" },
  1975: { type: "SL", oni: -1.72, season: "1975-1976" },
  1976: { type: "WE", oni: 0.78, season: "1976-1977" },
  1977: { type: "WE", oni: 0.81, season: "1977-1978" },
  1978: { type: "N", oni: -0.15, season: "1978-1979" },
  1979: { type: "WE", oni: 0.55, season: "1979-1980" },
  1980: { type: "N", oni: 0.22, season: "1980-1981" },
  1981: { type: "N", oni: -0.05, season: "1981-1982" },
  1982: { type: "VSE", oni: 2.24, season: "1982-1983" },
  1983: { type: "WL", oni: -0.88, season: "1983-1984" },
  1984: { type: "WL", oni: -0.95, season: "1984-1985" },
  1985: { type: "N", oni: -0.32, season: "1985-1986" },
  1986: { type: "ME", oni: 1.25, season: "1986-1987" },
  1987: { type: "SE", oni: 1.62, season: "1987-1988" },
  1988: { type: "SL", oni: -1.82, season: "1988-1989" },
  1989: { type: "N", oni: -0.15, season: "1989-1990" },
  1990: { type: "N", oni: 0.38, season: "1990-1991" },
  1991: { type: "SE", oni: 1.84, season: "1991-1992" },
  1992: { type: "N", oni: 0.18, season: "1992-1993" },
  1993: { type: "N", oni: 0.24, season: "1993-1994" },
  1994: { type: "ME", oni: 1.18, season: "1994-1995" },
  1995: { type: "WL", oni: -0.72, season: "1995-1996" },
  1996: { type: "N", oni: -0.35, season: "1996-1997" },
  1997: { type: "VSE", oni: 2.42, season: "1997-1998" },
  1998: { type: "ML", oni: -1.35, season: "1998-1999" },
  1999: { type: "SL", oni: -1.62, season: "1999-2000" },
  2000: { type: "WL", oni: -0.74, season: "2000-2001" },
  2001: { type: "N", oni: -0.18, season: "2001-2002" },
  2002: { type: "ME", oni: 1.28, season: "2002-2003" },
  2003: { type: "N", oni: 0.32, season: "2003-2004" },
  2004: { type: "WE", oni: 0.68, season: "2004-2005" },
  2005: { type: "N", oni: -0.14, season: "2005-2006" },
  2006: { type: "ME", oni: 1.12, season: "2006-2007" },
  2007: { type: "ML", oni: -1.42, season: "2007-2008" },
  2008: { type: "N", oni: -0.28, season: "2008-2009" },
  2009: { type: "SE", oni: 1.58, season: "2009-2010" },
  2010: { type: "ML", oni: -1.48, season: "2010-2011" },
  2011: { type: "WL", oni: -0.85, season: "2011-2012" },
  2012: { type: "N", oni: 0.12, season: "2012-2013" },
  2013: { type: "N", oni: -0.31, season: "2013-2014" },
  2014: { type: "ME", oni: 1.05, season: "2014-2015" },
  2015: { type: "VSE", oni: 2.62, season: "2015-2016" },
  2016: { type: "WL", oni: -0.75, season: "2016-2017" },
  2017: { type: "N", oni: -0.15, season: "2017-2018" },
  2018: { type: "ME", oni: 1.15, season: "2018-2019" },
  2019: { type: "WE", oni: 0.72, season: "2019-2020" },
  2020: { type: "WL", oni: -0.92, season: "2020-2021" },
  2021: { type: "ML", oni: -1.25, season: "2021-2022" },
  2022: { type: "SL", oni: -1.55, season: "2022-2023" },
  2023: { type: "SE", oni: 2.02, season: "2023-2024" },
  2024: { type: "ML", oni: -1.15, season: "2024-2025" },
  2025: { type: "SL", oni: -1.48, season: "2025-2026" },
  2026: { type: "N", oni: 0.12, season: "2026-2027" }
};

// Location Metadata
export const LOCATIONS = [
  { id: "california", name: "California", country: "USA", lat: 36.77, lng: -119.42 },
  { id: "mexico", name: "Sonora Coast", country: "Mexico", lat: 23.63, lng: -102.55 },
  { id: "peru", name: "Peru Coast", country: "Peru", lat: -12.04, lng: -77.03 },
  { id: "brazil_south", name: "Brazil South", country: "Brazil (South)", lat: -15.79, lng: -47.88 },
  { id: "kenya", name: "Kenya Highlands", country: "Kenya", lat: -1.29, lng: 36.82 },
  { id: "zimbabwe", name: "Zimbabwe Plains", country: "Zimbabwe", lat: -19.01, lng: 29.15 },
  { id: "south_africa", name: "South Africa Coast", country: "South Africa", lat: -30.56, lng: 22.94 },
  { id: "india_south", name: "South India", country: "India", lat: 13.08, lng: 80.27 },
  { id: "india_north", name: "North India", country: "India", lat: 28.61, lng: 77.21 },
  { id: "indonesia", name: "Sumatra & Borneo", country: "Indonesia", lat: -6.2, lng: 106.85 },
  { id: "vietnam", name: "Mekong Delta", country: "Vietnam", lat: 14.06, lng: 108.28 },
  { id: "philippines", name: "Luzon Coast", country: "Philippines", lat: 12.88, lng: 121.77 },
  { id: "australia", name: "Queensland", country: "Australia", lat: -20.92, lng: 142.7 }
];

export function generateHistoricalImpactRecords(): EnsoImpactRecord[] {
  const records: EnsoImpactRecord[] = [];

  const years = Object.keys(HISTORICAL_ENSO_STATES).map(Number).sort((a, b) => a - b);

  years.forEach(yr => {
    const state = HISTORICAL_ENSO_STATES[yr];
    const isElNino = ["VSE", "SE", "ME", "WE"].includes(state.type);
    const isLaNina = ["SL", "ML", "WL"].includes(state.type);
    const intensityFactor = Math.abs(state.oni);

    LOCATIONS.forEach(loc => {
      let tempAnomaly = 0.0;
      let rainfallAnomaly = 0.0;
      let impactCategory = "Typical Phase Conditions";
      let impactDescription = `Baseline meteorological normal during Neutral phase conditions.`;
      let severity: "Low" | "Moderate" | "High" | "Extreme" = "Low";

      if (loc.id === "india_south" || loc.id === "india_north") {
        const isNorth = loc.id === "india_north";
        if (isElNino) {
          tempAnomaly = Number((0.5 * intensityFactor + (isNorth ? 0.3 : 0.0)).toFixed(2));
          rainfallAnomaly = Number((-15 * intensityFactor).toFixed(1));
          impactCategory = isNorth ? "Heatwave" : "Monsoon Deficit";
          impactDescription = isNorth 
            ? `Simulated heatwave associated with ${getEnsoName(state.type)} conditions.`
            : `Simulated monsoon deficit associated with ${getEnsoName(state.type)} conditions.`;
          severity = intensityFactor >= 2.0 ? "Extreme" : intensityFactor >= 1.2 ? "High" : "Moderate";
        } else if (isLaNina) {
          tempAnomaly = Number((-0.3 * intensityFactor).toFixed(2));
          rainfallAnomaly = Number((10 * intensityFactor).toFixed(1));
          impactCategory = "Heavy Rain";
          impactDescription = `Simulated robust monsoonal precipitation from ${getEnsoName(state.type)} conditions.`;
          severity = intensityFactor >= 1.5 ? "High" : "Moderate";
        } else {
          tempAnomaly = Number((0.05 * Math.sin(yr)).toFixed(2));
          rainfallAnomaly = Number((1.5 * Math.cos(yr)).toFixed(1));
          impactCategory = "Normal Monsoon";
          impactDescription = `Standard agricultural crop yields expected under Neutral atmospheric cells.`;
          severity = "Low";
        }
      } 
      
      else if (loc.id === "peru") {
        if (isElNino) {
          tempAnomaly = Number((1.5 * intensityFactor).toFixed(2));
          rainfallAnomaly = Number((40 * intensityFactor).toFixed(1));
          impactCategory = "Heavy Rain";
          impactDescription = `Simulated heavy rain and marine upwelling collapse from ${getEnsoName(state.type)}.`;
          severity = intensityFactor >= 2.0 ? "Extreme" : intensityFactor >= 1.2 ? "High" : "Moderate";
        } else if (isLaNina) {
          tempAnomaly = Number((-0.8 * intensityFactor).toFixed(2));
          rainfallAnomaly = Number((-15 * intensityFactor).toFixed(1));
          impactCategory = "Cold SST Upwelling";
          impactDescription = `SST cooling of ${Math.abs(tempAnomaly)}°C drives rich anchovy harvests but dry coastal plains.`;
          severity = "Moderate";
        } else {
          tempAnomaly = Number((0.1 * Math.sin(yr)).toFixed(2));
          rainfallAnomaly = -2.1;
          impactCategory = "Standard SST";
          impactDescription = `Steady Humboldt currents backing high-productivity upwellings.`;
          severity = "Low";
        }
      }

      else if (loc.id === "california") {
        if (isElNino) {
          tempAnomaly = Number((-0.4 * intensityFactor).toFixed(2));
          rainfallAnomaly = Number((20 * intensityFactor).toFixed(1));
          impactCategory = "Flood";
          impactDescription = `Simulated flood associated with ${getEnsoName(state.type)} conditions.`;
          severity = intensityFactor >= 1.8 ? "High" : "Moderate";
        } else if (isLaNina) {
          tempAnomaly = Number((0.5 * intensityFactor).toFixed(2));
          rainfallAnomaly = Number((-18 * intensityFactor).toFixed(1));
          impactCategory = "Drought";
          impactDescription = `Subtropical ridge blocks storm tracks, triggering moisture deficits.`;
          severity = intensityFactor >= 1.5 ? "High" : "Moderate";
        } else {
          tempAnomaly = 0.1;
          rainfallAnomaly = -0.5;
          impactCategory = "Stable Reservoir Storage";
          impactDescription = `Snowpacks matching municipal and irrigation requirements.`;
          severity = "Low";
        }
      }

      else if (loc.id === "australia") {
        if (isElNino) {
          tempAnomaly = Number((0.8 * intensityFactor).toFixed(2));
          rainfallAnomaly = Number((-25 * intensityFactor).toFixed(1));
          impactCategory = "Drought";
          impactDescription = `Simulated drought associated with ${getEnsoName(state.type)} conditions.`;
          severity = intensityFactor >= 2.0 ? "Extreme" : intensityFactor >= 1.2 ? "High" : "Moderate";
        } else if (isLaNina) {
          tempAnomaly = Number((-0.5 * intensityFactor).toFixed(2));
          rainfallAnomaly = Number((25 * intensityFactor).toFixed(1));
          impactCategory = "Heavy Rain";
          impactDescription = `Intense trade winds push warm pool south, bringing river flooding.`;
          severity = intensityFactor >= 1.5 ? "High" : "Moderate";
        } else {
          tempAnomaly = -0.1;
          rainfallAnomaly = 1.2;
          impactCategory = "Normal Pastures";
          impactDescription = `Steady wheat belt yields and stable forest fuel index.`;
          severity = "Low";
        }
      }

      else if (loc.id === "indonesia") {
        if (isElNino) {
          tempAnomaly = Number((0.6 * intensityFactor).toFixed(2));
          rainfallAnomaly = Number((-35 * intensityFactor).toFixed(1));
          impactCategory = "Forest Fires";
          impactDescription = `Simulated forest fires and haze risk associated with ${getEnsoName(state.type)} conditions.`;
          severity = intensityFactor >= 1.8 ? "Extreme" : intensityFactor >= 1.0 ? "High" : "Moderate";
        } else if (isLaNina) {
          tempAnomaly = Number((-0.4 * intensityFactor).toFixed(2));
          rainfallAnomaly = Number((28 * intensityFactor).toFixed(1));
          impactCategory = "Heavy Rain";
          impactDescription = `Intensified Walker cell convection triggers pluvial floods.`;
          severity = intensityFactor >= 1.5 ? "High" : "Moderate";
        } else {
          tempAnomaly = 0.05;
          rainfallAnomaly = -1.1;
          impactCategory = "Normal Monsoon";
          impactDescription = `Standard precipitation patterns supporting rice crop scheduling.`;
          severity = "Low";
        }
      }

      else if (loc.id === "kenya") {
        if (isElNino) {
          tempAnomaly = Number((0.4 * intensityFactor).toFixed(2));
          rainfallAnomaly = Number((22 * intensityFactor).toFixed(1));
          impactCategory = "Heavy Rain";
          impactDescription = `Enhanced Indian Ocean Zonal Mode brings intense short rains.`;
          severity = intensityFactor >= 1.5 ? "High" : "Moderate";
        } else if (isLaNina) {
          tempAnomaly = Number((-0.3 * intensityFactor).toFixed(2));
          rainfallAnomaly = Number((-25 * intensityFactor).toFixed(1));
          impactCategory = "Drought";
          impactDescription = `Suppressed moisture convergence triggers severe East African dry spells.`;
          severity = intensityFactor >= 1.5 ? "Extreme" : intensityFactor >= 1.0 ? "High" : "Moderate";
        } else {
          tempAnomaly = 0.0;
          rainfallAnomaly = 0.5;
          impactCategory = "Balanced Pastures";
          impactDescription = `Healthy rangeland grazing indices supporting livestock.`;
          severity = "Low";
        }
      }

      else if (loc.id === "zimbabwe" || loc.id === "south_africa") {
        const isSA = loc.id === "south_africa";
        if (isElNino) {
          tempAnomaly = Number((0.9 * intensityFactor).toFixed(2));
          rainfallAnomaly = Number((-22 * intensityFactor).toFixed(1));
          impactCategory = "Drought";
          impactDescription = `Suppressed summer rains trigger severe dry spells and cereal production deficits.`;
          severity = intensityFactor >= 1.5 ? "High" : "Moderate";
        } else if (isLaNina) {
          tempAnomaly = Number((-0.4 * intensityFactor).toFixed(2));
          rainfallAnomaly = Number((15 * intensityFactor).toFixed(1));
          impactCategory = "Heavy Rain";
          impactDescription = `Favorable summer rains supporting high maize yield potentials.`;
          severity = "Moderate";
        } else {
          tempAnomaly = 0.1;
          rainfallAnomaly = -0.5;
          impactCategory = "Balanced Crops";
          impactDescription = `Standard soil moisture supporting regular sorghum and corn yields.`;
          severity = "Low";
        }
      }

      else if (loc.id === "brazil_south") {
        if (isElNino) {
          tempAnomaly = Number((0.5 * intensityFactor).toFixed(2));
          rainfallAnomaly = Number((25 * intensityFactor).toFixed(1));
          impactCategory = "Heavy Rain";
          impactDescription = `Enhanced subtropical jet triggers heavy rains and soil erosion in southern states.`;
          severity = intensityFactor >= 1.5 ? "High" : "Moderate";
        } else if (isLaNina) {
          tempAnomaly = Number((0.4 * intensityFactor).toFixed(2));
          rainfallAnomaly = Number((-20 * intensityFactor).toFixed(1));
          impactCategory = "Drought";
          impactDescription = `Subtropical high anomalies block winter fronts, creating soy irrigation stress.`;
          severity = intensityFactor >= 1.5 ? "High" : "Moderate";
        } else {
          tempAnomaly = 0.0;
          rainfallAnomaly = 0.0;
          impactCategory = "Balanced Soils";
          impactDescription = `Standard soil dampness backing high grain harvest potentials.`;
          severity = "Low";
        }
      }

      else if (loc.id === "vietnam" || loc.id === "philippines") {
        const isPhil = loc.id === "philippines";
        if (isElNino) {
          tempAnomaly = Number((0.6 * intensityFactor).toFixed(2));
          rainfallAnomaly = Number((-24 * intensityFactor).toFixed(1));
          impactCategory = "Drought";
          impactDescription = `Delayed summer monsoons create rice sowing delays and high heat stress.`;
          severity = intensityFactor >= 1.5 ? "High" : "Moderate";
        } else if (isLaNina) {
          tempAnomaly = Number((-0.3 * intensityFactor).toFixed(2));
          rainfallAnomaly = Number((20 * intensityFactor).toFixed(1));
          impactCategory = "Typhoon Risk";
          impactDescription = `Warm pool warming shifts storm-tracks westward, increasing tropical cyclone landfalls.`;
          severity = intensityFactor >= 1.5 ? "High" : "Moderate";
        } else {
          tempAnomaly = 0.1;
          rainfallAnomaly = -1.0;
          impactCategory = "Stable Fishery";
          impactDescription = `Baseline aquaculture yields and standard coastal tides.`;
          severity = "Low";
        }
      }

      else if (loc.id === "mexico") {
        if (isElNino) {
          tempAnomaly = Number((-0.3 * intensityFactor).toFixed(2));
          rainfallAnomaly = Number((18 * intensityFactor).toFixed(1));
          impactCategory = "Heavy Rain";
          impactDescription = `Subtropical storm tracks bring winter precipitation to northern wheat tracts.`;
          severity = "Moderate";
        } else if (isLaNina) {
          tempAnomaly = Number((0.6 * intensityFactor).toFixed(2));
          rainfallAnomaly = Number((-20 * intensityFactor).toFixed(1));
          impactCategory = "Drought";
          impactDescription = `Severe winter drought strains reservoir volumes in northwestern reservoirs.`;
          severity = intensityFactor >= 1.5 ? "High" : "Moderate";
        } else {
          tempAnomaly = 0.0;
          rainfallAnomaly = 0.0;
          impactCategory = "Balanced Flow";
          impactDescription = `Typical flow rates across Yaqui Valley canals.`;
          severity = "Low";
        }
      }

      records.push({
        year: yr,
        season: state.season,
        ensoType: state.type,
        peakOni: state.oni,
        region: loc.name,
        country: loc.country,
        latitude: loc.lat,
        longitude: loc.lng,
        temperatureAnomaly: tempAnomaly,
        rainfallAnomaly,
        impactCategory,
        impactDescription,
        severity
      });
    });
  });

  return records;
}

function getEnsoName(type: string): string {
  switch (type) {
    case "VSE": return "Very Strong El Niño";
    case "SE": return "Strong El Niño";
    case "ME": return "Moderate El Niño";
    case "WE": return "Weak El Niño";
    case "WL": return "Weak La Niña";
    case "ML": return "Moderate La Niña";
    case "SL": return "Strong La Niña";
    default: return "Neutral";
  }
}
