export const scoreConfig = {
  weights: {
    sleep: 0.3,
    nutrition: 0.2,
    activity: 0.2,
    stress: 0.15,
    observations: 0.15,
  },
  sleep: {
    hoursWeight: 0.6,
    qualityWeight: 0.4,
    optimalHoursMin: 7,
    optimalHoursMax: 9,
    oversleepPenaltyPerHour: 20,
  },
  activity: {
    targetMinutes: 30,
    intensityBonusThreshold: 3,
    intensityBonusPerLevel: 0.1,
  },
  nutrition: {
    pointsPerMealType: 25,
    detailBonusPerMeal: 5,
    maxDetailBonus: 20,
  },
  stress: {
    maxScore: 100,
    minScore: 20,
  },
  observations: {
    baseScore: 50,
    pointsPerPositive: 12,
    pointsPerNegative: 8,
    trackingBonus: 10,
  },
};
