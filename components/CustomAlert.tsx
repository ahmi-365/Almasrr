import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { AlertTriangle, CheckCircle } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const CustomAlert = ({
    isVisible,
    title,
    message,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
    confirmButtonColor = '#FF6B35',
    success = false, // Default to false (safe fallback)
}) => {
    const isSuccess = !!success; // Convert null, undefined, or false to false

    const iconColor = isSuccess ? '#2ECC71' : '#FF6B35';
    const iconBgColor = isSuccess ? '#2ECC7120' : '#FF6B3520';

    return (
        <Modal
            visible={isVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.alertContainer}>
                    <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
                        {isSuccess ? (
                            <CheckCircle color={iconColor} size={32} />
                        ) : (
                            <AlertTriangle color={iconColor} size={32} />
                        )}
                    </View>

                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.buttonContainer}>
                        {cancelText ? (
                            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                                <Text style={styles.cancelButtonText}>{cancelText}</Text>
                            </TouchableOpacity>
                        ) : null}

                        <TouchableOpacity
                            style={[styles.confirmButton, { backgroundColor: confirmButtonColor }]}
                            onPress={onConfirm}
                        >
                            <Text style={styles.confirmButtonText}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertContainer: {
        width: width * 0.85,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: '#718096',
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-around',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        marginRight: 10,
    },
    cancelButtonText: {
        color: '#475569',
        fontSize: 16,
        fontWeight: '600',
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default CustomAlert;
