/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GlobalRegion {
  id: string;
  name: string;
  lat: number;
  lng: number;
  tempCoef: number;      
  precipCoef: number;    
  averageTemp: number;   
  averagePrecip: number; 
  stdTemp: number;       
  stdPrecip: number;     
  lagMonths: number;     
  soilMoistureCoef: number; 
  desc: string;          
  
  // Computed fields from harmonization engine
  calculatedTempAnomaly?: number;
  zScoreTemp?: number;
  calculatedPrecipAnomaly?: number;
  precipPercentAnomaly?: number;
  zScorePrecip?: number;
  currentTemp?: number;
  currentPrecip?: number;
  soilMoistureStress?: number;
  thermalDifferential?: number;
  hazardLevel?: "Low" | "Moderate" | "High" | "Extreme";
  teleconnectionLaggedMonth?: number;
}

export interface HistoricalRecord {
  year: number;
  month: number;
  oni: number;
  mei: number;
  phase: "El Nino" | "La Nina" | "Neutral";
  globalTempAnomaly: number;
}

export interface HarmonizedFeatureSet {
  reconstructedFeii: number;
  planetaryWaveTransmissionDelayDays: number;
  landSeaContrastDegC: number;
  climateEngineFlag: string;
}
