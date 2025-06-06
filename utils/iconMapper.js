import { Ionicons } from 'expo/vector-icons';

export const mapIcon = (iconName) => {
    const iconMap = {
        //Shopping related
        'shopping-cart': 'cart-outline',
        'add-shopping-cart': 'cart-add-outline',

        //Navigation related
        'home': 'home-outline',
        'settings': 'settings-outline',
        'list': 'list-outline',

        //Action icons
        'add': 'add-outline',
        'edit': 'create-outline',
        'delete': 'trash-outline',

        //MIscellaneous
        'lightbulb': 'bulb-outline',
        'restaurant': 'restaurant-outline',
        'people': 'people-outline',
        'access-time': 'time-outline',

        //default fallback icon
        'default': 'help-circle-outline',
    };

    return iconMap[iconName] || iconMap['default'];
};

//Custom Ionicons component with fallback
export const Icon = ({name, ...props }) => {
    const mappedName = mapIcon(name);
    return <Ionicons name={mappedName} {...props} />
};