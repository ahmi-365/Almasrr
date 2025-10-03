import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Text, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import CustomPlusButton from '../components/Entity/CustomPlusButton';
import { MessageCircle, ClipboardPlus } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 70;

const AnimatedTabItem = ({ isFocused, label, icon, onPress }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isFocused) {
            Animated.spring(scaleAnim, {
                toValue: 1.1,
                friction: 3,
                useNativeDriver: true,
            }).start(() => {
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 3,
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
            <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, { alignItems: 'center' }]}>
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
    const [isMenuOpen, setMenuOpen] = useState(false);
    const animation = useRef(new Animated.Value(0)).current;

    const toggleMenu = () => {
        const toValue = isMenuOpen ? 0 : 1;
        setMenuOpen(!isMenuOpen);
        Animated.timing(animation, {
            toValue,
            duration: 300,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1),
            useNativeDriver: true,
        }).start();
    };

    const rotation = {
        transform: [
            {
                rotate: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '45deg'],
                }),
            },
        ],
    } as any;

    const bubble1Style = {
        transform: [
            { scale: animation },
            {
                translateX: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -85],
                }),
            },
            {
                translateY: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -60],
                }),
            },
        ],
    } as any;

    const bubble2Style = {
        transform: [
            { scale: animation },
            {
                translateX: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 85],
                }),
            },
            {
                translateY: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -60],
                }),
            },
        ],
    } as any;

    const createNotchedPath = () => {
        const centerWidth = width / 2;
        const notchRadius = 35;
        return `M 0 0 L ${centerWidth - notchRadius - 15} 0 Q ${centerWidth - notchRadius - 5} 0 ${centerWidth - notchRadius} 5 C ${centerWidth - notchRadius + 15} 30 ${centerWidth + notchRadius - 15} 30 ${centerWidth + notchRadius} 5 Q ${centerWidth + notchRadius + 5} 0 ${centerWidth + notchRadius + 15} 0 L ${width} 0 L ${width} ${TAB_BAR_HEIGHT + insets.bottom} L 0 ${TAB_BAR_HEIGHT + insets.bottom} Z`;
    };

    const createFlatPath = () => `M 0 0 L ${width} 0 L ${width} ${TAB_BAR_HEIGHT + insets.bottom} L 0 ${TAB_BAR_HEIGHT + insets.bottom} Z`;

    const handleBubblePress = (screen) => {
        toggleMenu();
        navigation.navigate(screen);
    };

    return (
        <View style={styles.tabBarContainer}>
            {hasAddTab && (
                <View style={styles.bubblesWrapper} pointerEvents="box-none">
                    {/* --- 1. WRAP TEXT LABELS IN A VIEW FOR BADGE STYLING --- */}
                    <Animated.View style={[styles.bubble, bubble1Style]}>
                        <View style={styles.bubbleContentContainer}>
                            <TouchableOpacity onPress={() => handleBubblePress('AddParcelWhatsapp')}>
                                <View style={styles.iconCircle}>
                                    <MessageCircle color="#FFFFFF" size={26} />
                                </View>
                            </TouchableOpacity>
                            <View style={styles.badgeContainer}>
                                <Text style={styles.bubbleLabel}> طلب تجميع </Text>
                            </View>
                        </View>
                    </Animated.View>

                    <Animated.View style={[styles.bubble, bubble2Style]}>
                        <View style={styles.bubbleContentContainer}>
                            <TouchableOpacity onPress={() => handleBubblePress('AddParcelForm')}>
                                <View style={styles.iconCircle}>
                                    <ClipboardPlus color="#FFFFFF" size={26} />
                                </View>
                            </TouchableOpacity>
                            <View style={styles.badgeContainer}>
                                <Text style={styles.bubbleLabel}>إدخال طرد جديد </Text>
                            </View>
                        </View>
                    </Animated.View>
                </View>
            )}
            <Svg width={width} height={TAB_BAR_HEIGHT + insets.bottom} style={{ position: 'absolute' }}>
                <Path d={hasAddTab ? createNotchedPath() : createFlatPath()} fill="#FFFFFF" stroke="#E5E5E5" strokeWidth={1} />
            </Svg>

            <View style={styles.iconsContainer}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;

                    const onPress = () => {
                        if (route.name === 'AddTab') {
                            toggleMenu();
                            return;
                        }
                        const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    if (route.name === 'AddTab') {
                        return (
                            <View key={route.key} style={styles.addButtonContainer}>
                                <TouchableOpacity style={styles.addButton} onPress={onPress}>
                                    <Animated.View style={rotation}>
                                        <CustomPlusButton />
                                    </Animated.View>
                                </TouchableOpacity>
                            </View>
                        );
                    }
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
    addButtonContainer: {
        flex: 1,
        alignItems: 'center',
    },
    addButton: {
        position: 'absolute',
        top: -85,
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
    // --- 2. ADJUST WRAPPER POSITION ---
    bubblesWrapper: {
        position: 'absolute',
        bottom: 150, // Increased to make space for the badge
        width: '100%',
        alignItems: 'center',
    },
    bubble: {
        position: 'absolute',
        width: 120,
        alignItems: 'center',
    },
    bubbleContentContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E67E22',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    // --- 3. ADD BADGE CONTAINER STYLE ---
    badgeContainer: {
        marginTop: 10,
        backgroundColor: '#34495E', // A dark color for the badge
        borderRadius: 8,
        paddingVertical: 4,
        paddingHorizontal: 6,
        elevation: 2,
    },
    // --- 4. UPDATE BUBBLE LABEL STYLE ---
    bubbleLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FFFFFF', // Changed to white for contrast
        textAlign: 'center',
    },
});

export default CustomTabBar;