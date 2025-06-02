
type SelectionListData = {
  label: string;
  value: number;
};
export const CROP_FACTORS: SelectionListData[] = [
  { label: 'Full Frame (1.0×)', value: 1 },
  { label: 'Canon APS-C (1.6×)', value: 1.6 },
  { label: 'Sony/Nikon APS-C (1.5×)', value: 1.5 },
  { label: 'Micro Four Thirds (2.0×)', value: 2 },
];

export const ASPECT_RATIOS: SelectionListData[] = [
  { label: '4:3', value: 0 },
  { label: '16:9', value: 1 },
];