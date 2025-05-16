
export interface FormFieldOption {
  value: string;
  label: string;
}
export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'date';
  placeholder?: string;
  options?: FormFieldOption[]; // For select, radio-group
  required?: boolean;
  defaultValue?: string | number | boolean;
  validation?: any; // Zod schema for validation
}

export interface FormDefinition {
  id: string;
  name: string;
  description: string;
  icon?: React.ElementType; // Lucide icon component
  fields: FormField[];
}

// Example using lucide-react icons (ensure these are installed or adjust as needed)
import { ClipboardList, Wrench, Truck } from 'lucide-react';

export const formDefinitions: FormDefinition[] = [
  {
    id: 'site-inspection',
    name: 'Site Inspection Report',
    description: 'Daily report for construction site inspections.',
    icon: ClipboardList,
    fields: [
      { id: 'inspectionDate', label: 'Inspection Date', type: 'date', required: true },
      { id: 'inspectorName', label: 'Inspector Name', type: 'text', placeholder: 'e.g., John Doe', required: true },
      { id: 'siteLocation', label: 'Site Location/Area', type: 'text', placeholder: 'e.g., Sector A, Building 2', required: true },
      { 
        id: 'weatherConditions', 
        label: 'Weather Conditions', 
        type: 'select', 
        options: [
          { value: 'sunny', label: 'Sunny' },
          { value: 'cloudy', label: 'Cloudy' },
          { value: 'rainy', label: 'Rainy' },
          { value: 'windy', label: 'Windy' },
        ], 
        required: true 
      },
      { id: 'observations', label: 'Observations & Issues', type: 'textarea', placeholder: 'Describe any observations or issues found...', required: true },
      { id: 'safetyCompliance', label: 'Safety Gear Compliance (PPE)', type: 'checkbox', defaultValue: true },
      { id: 'correctiveActions', label: 'Corrective Actions Taken', type: 'textarea', placeholder: 'Detail any corrective actions implemented.' },
    ],
  },
  {
    id: 'equipment-check',
    name: 'Equipment Maintenance Check',
    description: 'Form for routine equipment maintenance checks.',
    icon: Wrench,
    fields: [
      { id: 'checkDate', label: 'Check Date', type: 'date', required: true },
      { id: 'equipmentId', label: 'Equipment ID', type: 'text', placeholder: 'e.g., EXCV-003', required: true },
      { 
        id: 'equipmentType', 
        label: 'Equipment Type', 
        type: 'select',
        options: [
          { value: 'excavator', label: 'Excavator' },
          { value: 'crane', label: 'Crane' },
          { value: 'generator', label: 'Generator' },
          { value: 'welder', label: 'Welding Machine' },
        ],
        required: true 
      },
      { id: 'operatorName', label: 'Operator/Technician', type: 'text', required: true },
      { id: 'hoursMeter', label: 'Hours Meter Reading', type: 'number', placeholder: 'e.g., 1250.5' },
      { id: 'fuelLevel', label: 'Fuel Level (%)', type: 'number', placeholder: 'e.g., 75', min: 0, max: 100 },
      { id: 'oilLevelOk', label: 'Oil Level OK', type: 'checkbox', defaultValue: false },
      { id: 'maintenanceNotes', label: 'Maintenance Notes', type: 'textarea', placeholder: 'Any specific notes on maintenance performed or required.' },
    ],
  },
  {
    id: 'material-delivery',
    name: 'Material Delivery Receipt',
    description: 'Record details of materials delivered to site.',
    icon: Truck,
    fields: [
      { id: 'deliveryDate', label: 'Delivery Date', type: 'date', required: true },
      { id: 'supplierName', label: 'Supplier Name', type: 'text', placeholder: 'e.g., Concrete Inc.', required: true },
      { id: 'vehicleReg', label: 'Vehicle Registration', type: 'text', placeholder: 'e.g., AB12 CDE' },
      { id: 'driverName', label: 'Driver Name', type: 'text' },
      { id: 'materialType', label: 'Material Type', type: 'text', placeholder: 'e.g., Cement Bags, Steel Rebars', required: true },
      { id: 'quantity', label: 'Quantity Delivered', type: 'number', placeholder: 'e.g., 100', required: true },
      { 
        id: 'unit', 
        label: 'Unit', 
        type: 'select', 
        options: [
          { value: 'bags', label: 'Bags' },
          { value: 'tons', label: 'Tons' },
          { value: 'm3', label: 'Cubic Meters (m³)' },
          { value: 'units', label: 'Units' },
          { value: 'length_m', label: 'Meters (length)' },
        ],
        required: true 
      },
      { id: 'qualityCheckPassed', label: 'Quality Check Passed', type: 'checkbox', defaultValue: false },
      { id: 'receivedBy', label: 'Received By (Site Manager)', type: 'text', required: true },
      { id: 'deliveryNotes', label: 'Delivery Notes/Discrepancies', type: 'textarea' },
    ],
  },
];

export const getFormDefinition = (formId: string): FormDefinition | undefined => {
  return formDefinitions.find(form => form.id === formId);
};
