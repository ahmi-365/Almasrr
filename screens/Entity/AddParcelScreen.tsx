// screens/Entity/AddParcelScreen.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AddParcelScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>إضافة طرد جديد</Text>
            <Text style={styles.subtitle}>
                هذه الشاشة مخصصة لإضافة طرد جديد للنظام.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#7F8C8D',
        textAlign: 'center',
    },
});