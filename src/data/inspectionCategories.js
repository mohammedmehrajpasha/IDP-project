// src/data/checklistData.js

const checklistSchema = {
  personalHygiene: {
    handsClean: 'Staff hands are clean and washed regularly',
    uniformClean: 'Staff uniforms are clean and appropriate',
    hairCovered: 'Hair is properly covered during food handling',
    noJewelry: 'No jewelry worn during food preparation'
  },
  premisesCleanliness: {
    floorsClean: 'Floors are clean and well-maintained',
    wallsClean: 'Walls are clean and free from stains',
    ceilingsClean: 'Ceilings are clean and well-maintained',
    tablesClean: 'Tables and surfaces are properly sanitized'
  },
  foodStorage: {
    temperatureControlled: 'Food stored at appropriate temperatures',
    separateRawCooked: 'Raw and cooked foods stored separately',
    properLabeling: 'Food items are properly labeled with dates',
    noExpiredItems: 'No expired food items found'
  },
  equipment: {
    cleanUtensils: 'Utensils are clean and properly stored',
    workingRefrigeration: 'Refrigeration equipment working properly',
    properSanitization: 'Equipment is properly sanitized',
    maintenanceUpToDate: 'Equipment maintenance is up to date'
  },
  wasteManagement: {
    properDisposal: 'Waste is disposed of properly',
    coveredBins: 'Waste bins are covered and clean',
    regularCollection: 'Regular waste collection schedule followed',
    pestControl: 'Effective pest control measures in place'
  }
};

const sectionLabels = {
  personalHygiene: 'Personal Hygiene',
  premisesCleanliness: 'Premises Cleanliness',
  foodStorage: 'Food Storage',
  equipment: 'Equipment & Utensils',
  wasteManagement: 'Waste Management'
};

module.exports = {
  checklistSchema,
  sectionLabels
};
