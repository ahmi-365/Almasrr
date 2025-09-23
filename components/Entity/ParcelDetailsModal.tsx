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
import { X } from 'lucide-react-native';

// Helper function from Reports Dashboard
const hexToRgba = (hex: string, opacity: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

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
        <Text style={modalStyles.detailLabel}>{label}</Text>
        <Text style={modalStyles.detailValue}>{value}</Text>
      </View>
    );
  };

  // Updated status colors to match Reports Dashboard
  const getStatusColor = (status, statusName) => {
    const numericColorMap = {
      1: '#D97706', // Dark orange for new
      2: '#B45309', // Dark amber for preparing
      3: '#EA580C', // Dark orange for ready to ship
      4: '#C2410C', // Dark peach for in transit
      5: '#059669', // Dark green for delivered
      6: '#DC2626', // Dark red for rejected
      7: '#D97706', // Dark orange for returned
    };
    
    if (status && numericColorMap[status]) {
      return numericColorMap[status];
    }
    
    const statusNameColorMap = {
      'جديد': '#D97706',
      'قيد التحضير': '#B45309',
      'جاهز للشحن': '#EA580C',
      'قيد التوصيل': '#C2410C',
      'في الطريق إلى الفرع الوجهة': '#C2410C',
      'تم التسليم': '#059669',
      'مرفوض': '#DC2626',
      'مرتجع': '#D97706',
      'تم الاستلام من العميل': '#B45309',
      'في المخزن': '#EA580C',
    };
    
    if (statusName && statusNameColorMap[statusName]) {
      return statusNameColorMap[statusName];
    }
    
    return '#D97706'; // Default orange
  };

  const getStatusBackgroundColor = (status, statusName) => {
    const numericColorMap = {
      1: '#FFF4E6', // Very light orange for new
      2: '#FFF8E1', // Very light amber for preparing
      3: '#FFF3E0', // Very light orange for ready to ship
      4: '#FFEDCC', // Very light peach for in transit
      5: '#E8F5E8', // Very light green for delivered
      6: '#FFE4E1', // Very light red for rejected
      7: '#FFE0B2', // Very light orange for returned
    };
    
    if (status && numericColorMap[status]) {
      return numericColorMap[status];
    }
    
    const statusNameColorMap = {
      'جديد': '#FFF4E6',
      'قيد التحضير': '#FFF8E1',
      'جاهز للشحن': '#FFF3E0',
      'قيد التوصيل': '#FFEDCC',
      'في الطريق إلى الفرع الوجهة': '#FFEDCC',
      'تم التسليم': '#E8F5E8',
      'مرفوض': '#FFE4E1',
      'مرتجع': '#FFE0B2',
      'تم الاستلام من العميل': '#FFF8E1',
      'في المخزن': '#FFF3E0',
    };
    
    if (statusName && statusNameColorMap[statusName]) {
      return statusNameColorMap[statusName];
    }
    
    return '#FFF4E6';
  };

  const statusColor = getStatusColor(parcel.status, parcel.StatusName);
  const statusBgColor = getStatusBackgroundColor(parcel.status, parcel.StatusName);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
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
                <X color="#9CA3AF" size={24} />
              </TouchableOpacity>

              <Text style={modalStyles.modalTitle}>تفاصيل الطرد</Text>

              <View style={[modalStyles.statusHeader, { backgroundColor: statusBgColor }]}>
                <Text style={[modalStyles.statusText, { color: statusColor }]}>
                  {parcel.StatusName}
                </Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Same as Reports Dashboard modal
  },
  modalView: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF', // Same as Reports Dashboard
    borderRadius: 8, // Same border radius as Reports Dashboard
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, // Reduced to match Reports Dashboard
    shadowRadius: 8, // Same as Reports Dashboard
    elevation: 3, // Same as Reports Dashboard
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    left: 12, // Changed from right to left for consistency
    zIndex: 1,
    padding: 2,
  },
  modalTitle: {
    fontSize: 18, // Reduced from 20
    fontWeight: 'bold',
    color: '#1F2937', // Same as Reports Dashboard
    textAlign: 'center',
    marginBottom: 12,
    paddingRight: 32, // Reduced padding
  },
  statusHeader: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8, // Same border radius as Reports Dashboard badges
    marginBottom: 16,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14, // Same as Reports Dashboard status text
    fontWeight: '600', // Same as Reports Dashboard
  },
  detailsContainer: {
    paddingBottom: 16,
  },
  detailRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 8, // Reduced from 12
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6', // Same as Reports Dashboard border color
  },
  detailLabel: {
    fontSize: 12, // Same as Reports Dashboard label size
    color: '#6B7280', // Same as Reports Dashboard label color
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14, // Same as Reports Dashboard value size
    color: '#1F2937', // Same as Reports Dashboard text color
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
});

export default ParcelDetailsModal;