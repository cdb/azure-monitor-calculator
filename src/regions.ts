export interface RegionInfo {
  id: string;
  label: string;
  group: 'primary' | 'active';
}

export const REGIONS: RegionInfo[] = [
  // Primary US regions
  { id: 'eastus', label: 'East US', group: 'primary' },
  { id: 'eastus2', label: 'East US 2', group: 'primary' },
  { id: 'centralus', label: 'Central US', group: 'primary' },
  { id: 'westus2', label: 'West US 2', group: 'primary' },
  { id: 'westus3', label: 'West US 3', group: 'primary' },
  { id: 'northcentralus', label: 'North Central US', group: 'primary' },
  { id: 'southcentralus', label: 'South Central US', group: 'primary' },
  { id: 'westcentralus', label: 'West Central US', group: 'primary' },
  { id: 'westus', label: 'West US', group: 'primary' },

  // Active regions (where user has data)
  { id: 'australiaeast', label: 'Australia East', group: 'active' },
  { id: 'canadacentral', label: 'Canada Central', group: 'active' },
  { id: 'japanwest', label: 'Japan West', group: 'active' },
  { id: 'koreacentral', label: 'Korea Central', group: 'active' },
  { id: 'swedencentral', label: 'Sweden Central', group: 'active' },
  { id: 'westeurope', label: 'West Europe', group: 'active' },
];
