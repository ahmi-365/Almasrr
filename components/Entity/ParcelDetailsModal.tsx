import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  TouchableWithoutFeedback,
  ScrollView,
  Animated,
} from 'react-native';
import { XCircle } from 'lucide-react-native';

const ParcelDetailsModal = ({ isVisible, onClose, parcel }) => {
  const animatedScale = useRef(new Animated.Value(0.7)).current;
  const animatedOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      animatedScale.setValue(0.7);
      animatedOpacity.setValue(0);
      
      Animated.parallel([
        Animated.spring(animatedScale, {
          toValue: 1,
          damping: 10,
          stiffness: 100,
          useNativeDriver: true,
        }),
        Animated.timing(animatedOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  if (!parcel) {
    return null;
  }

  const renderDetailRow = (label, value) => {
    if (!value) return null;
    return (
      <View style={modalStyles.detailRow}>
        <Text style={modalStyles.detailLabel}>{label}:</Text>
        <Text style={modalStyles.detailValue}>{value}</Text>
      </View>
    );
  };

  const getStatusColor = (status) => {
    const colorMap = {
      1: '#3182CE', // In-transit
      2: '#F6AD55', // Pending
      3: '#38B2AC', // Delivered
      4: '#9F7AEA', // Returned
      5: '#48BB78', // Picked up
      6: '#E53E3E', // Canceled
      7: '#ED8936', // Exception
    };
    return colorMap[status] || '#718096';
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        {/*
          This is the key to a full-screen backdrop. 
          Use StyleSheet.absoluteFillObject on the parent View of the modal content.
          This will make it cover the entire screen, regardless of the parent view's size.
        */}
        <View style={modalStyles.backdrop}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <Animated.View 
              style={[
                modalStyles.modalView,
                { 
                  transform: [{ scale: animatedScale }],
                  opacity: animatedOpacity,
                }
              ]}
            >
              <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
                <XCircle color="#999" size={24} />
              </TouchableOpacity>

              <Text style={modalStyles.modalTitle}>تفاصيل الطرد</Text>

              <View style={[modalStyles.statusHeader, { backgroundColor: getStatusColor(parcel.status) }]}>
                <Text style={modalStyles.statusText}>{parcel.StatusName}</Text>
              </View>
              
              <ScrollView contentContainerStyle={modalStyles.detailsContainer}>
                {renderDetailRow('المرجع', parcel.ReferenceNo)}
                {renderDetailRow('كود الطرد', `#${parcel.intParcelCode}`)}
                {renderDetailRow('المدينة', parcel.CityName)}
                {renderDetailRow('هاتف المستلم', parcel.RecipientPhone)}
                {renderDetailRow('اسم المستلم', parcel.RecipientName)} 
                {renderDetailRow('تاريخ الإنشاء', new Date(parcel.CreatedAt).toLocaleDateString('ar-SA'))}
                {renderDetailRow('النوع', parcel.TypeName)}
                {renderDetailRow('الكمية', parcel.Quantity)}
                {renderDetailRow('إجمالي المبلغ', `${parcel.Total} د.ل`)}
                {renderDetailRow('رسوم التوصيل', `${parcel.dcFee} د.ل`)} 
                {parcel.strDriverRemarks && renderDetailRow('ملاحظات المندوب', parcel.strDriverRemarks)}
                {parcel.Remarks && renderDetailRow('ملاحظات', parcel.Remarks)}
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  statusHeader: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  detailsContainer: {
    paddingBottom: 20,
  },
  detailRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailLabel: {
    fontSize: 14,
    color: '#777',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
});

export default ParcelDetailsModal;
