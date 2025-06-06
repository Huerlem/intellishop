// constants/stockConstants.js
export const CATEGORIES_ICONS = [
    { id: 'food', label: 'Food' },
    { id: 'drink', label: 'Drink', icon: 'local-bar' },
    { id: 'cleaning', label: 'Clean Product', icon: 'cleaning-services' },
    { id: 'hygiene', label: 'Hygiene', icon: 'spa' },
    { id: 'fruits', label: 'Fruits', icon: 'apple' },
    { id: 'vegetables', label: 'Vegetables', icon: 'eco' },
    { id: 'dairy', label: 'Dairy', icon: 'opacity' },
    { id: 'meat', label: 'Meat', icon: 'restaurant' },
    { id: 'bakery', label: 'bakery', icon: 'cake' },
    { id: 'frozen', label: 'Frozen', icon: 'ac-unit' },
    { id: 'canned', label: 'Canned', icon: 'inventory-2' },
    { id: 'snacks', label: 'Snacks', icon: 'fastfood' },
    { id: 'personal', label: 'Personal Care' },
    { id: 'others', label: 'Others', icon: 'more-horiz' },
];

export const LOCATIONS = [
    { id: 'storage', label: 'Storage' },
    { id: 'fridge', label: 'Fridge' },
    { id: 'freezer', label: 'Freezer' },
    { id: 'bathroom', label: 'Bathroom' },
    { id: 'laundry', label: 'Laundry' },
    { id: 'kitchen', label: 'Kitchen' },
    { id: 'pantry', label: 'Pantry' },
    { id: 'basement', label: 'basement' },
    { id: 'garage', label: 'Garage' },
    { id: 'others', label: 'Others'},
];

export const UNITS = [
    { id: 'un', label: 'Unit' },
    { id: 'kg', label: 'Kg' },
    { id: 'g', label: 'g' },
    { id: 'l', label: 'L' },
    { id: 'ml', label: 'ml' },
    { id: 'pack', label: 'Pack' },
    { id: 'box', label: 'Box' },
    { id: 'bottle', label: 'Bottle' }
  ];

export const SORT_OPTIONS = [
    { id: 'name', label: 'Name' },
    { id: 'quantity', label: 'Quantity' },
    { id: 'expiryDate', label: 'Expiry Date' },
    { id: 'category', label: 'Category' },
    { id: 'location', label: 'Location' },
];

export const FILTER_OPTIONS = [
    { id: 'all', label: 'All' },
    { id: 'low', label: 'Low' },
    { id: 'expiring', label: 'Expiring' },
];

export const DEFAULT_LOW_STOCK_THRESHOLD = 3;
export const DEFAULT_CRITICAL_STOCK_THRESHOLD = 1;
export const DEFAULT_EXPIRY_WARNING_DAYS = 7; // days before expiration to show warning

export default {
    CATEGORIES_ICONS,
    LOCATIONS,
    UNITS,
    SORT_OPTIONS,
    FILTER_OPTIONS,
    DEFAULT_LOW_STOCK_THRESHOLD,
    DEFAULT_CRITICAL_STOCK_THRESHOLD,
    DEFAULT_EXPIRY_WARNING_DAYS
};