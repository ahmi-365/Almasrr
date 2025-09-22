import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Text, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import CustomPlusButton from '../components/Entity/CustomPlusButton';

const { width } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 70;

const AnimatedTabItem = ({ isFocused, label, icon, onPress }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isFocused) {
            Animated.spring(scaleAnim, {
                toValue: 1.1,
                friction: 3,
                tension: 80,
                useNativeDriver: true,
            }).start(() => {
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 3,
                    tension: 80,
                    useNativeDriver: true,
                }).start();
            });
        }
    }, [isFocused, scaleAnim]);

    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={styles.tabItem}
        >
            <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
                {icon}
            </Animated.View>
            {isFocused && (
                <Text style={styles.tabLabel}>
                    {label}
                </Text>
            )}
        </TouchableOpacity>
    );
};


const CustomTabBar = ({ state, descriptors, navigation }) => {
    const insets = useSafeAreaInsets();
    const hasAddTab = state.routes.some(route => route.name === 'AddTab');

    const createNotchedPath = () => {
        const centerWidth = width / 2;
        const notchRadius = 35;
        return `M 0 0 L ${centerWidth - notchRadius - 15} 0 Q ${centerWidth - notchRadius - 5} 0 ${centerWidth - notchRadius} 5 C ${centerWidth - notchRadius + 15} 30 ${centerWidth + notchRadius - 15} 30 ${centerWidth + notchRadius} 5 Q ${centerWidth + notchRadius + 5} 0 ${centerWidth + notchRadius + 15} 0 L ${width} 0 L ${width} ${TAB_BAR_HEIGHT + insets.bottom} L 0 ${TAB_BAR_HEIGHT + insets.bottom} Z`;
    };

    const createFlatPath = () => {
        return `M 0 0 L ${width} 0 L ${width} ${TAB_BAR_HEIGHT + insets.bottom} L 0 ${TAB_BAR_HEIGHT + insets.bottom} Z`;
    };

    return (
        <View style={styles.tabBarContainer}>
            <Svg width={width} height={TAB_BAR_HEIGHT + insets.bottom} style={{ position: 'absolute', top: 0 }}>
                <Path d={hasAddTab ? createNotchedPath() : createFlatPath()} fill="#FFFFFF" stroke="#E5E5E5" strokeWidth={1} />
            </Svg>
            <View style={styles.iconsContainer}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    if (route.name === 'AddTab') {
                        return (
                            <TouchableOpacity key={route.key} style={styles.addButton} onPress={onPress}>
                                <CustomPlusButton />
                            </TouchableOpacity>
                        );
                    }

                    // --- FIX: The `size` prop is no longer needed here ---
                    // The tabBarIcon function in the navigator now defines its own size.
                    const icon = options.tabBarIcon ? options.tabBarIcon({ focused: isFocused, color: isFocused ? '#E67E22' : '#95A5A6' }) : null;
                    const label = options.title !== undefined ? options.title : route.name;

                    return (
                        <AnimatedTabItem
                            key={route.key}
                            isFocused={isFocused}
                            label={label}
                            icon={icon}
                            onPress={onPress}
                        />
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    tabBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: TAB_BAR_HEIGHT,
        backgroundColor: 'transparent',
        alignItems: 'center',
    },
    iconsContainer: {
        flexDirection: 'row',
        height: '100%',
        width: '100%',
        alignItems: 'center',

    },
    tabItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
    },
    addButton: {
        top: -50,
        justifyContent: 'center',
        alignItems: 'center',
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#FFFFFF',
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 4,
        color: '#E67E22',
    },
});

export default CustomTabBar;