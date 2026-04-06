import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function UserForm({ visible, user, onSubmit, onCancel }) {
  const isEdit = !!user;
  const [form, setForm] = useState({
    username: '', password: '', full_name: '', role: 'user', card_uid: '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username,
        password: '',
        full_name: user.full_name,
        role: user.role,
        card_uid: user.card_uid || '',
      });
    } else {
      setForm({ username: '', password: '', full_name: '', role: 'user', card_uid: '' });
    }
  }, [user, visible]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = () => {
    const data = { ...form };
    if (isEdit && !data.password) delete data.password;
    if (!data.card_uid) data.card_uid = null;
    onSubmit(data);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>
            {isEdit ? 'Sửa người dùng' : 'Thêm người dùng'}
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={[styles.input, isEdit && styles.inputDisabled]}
              value={form.username}
              onChangeText={(v) => set('username', v)}
              editable={!isEdit}
              autoCapitalize="none"
            />

            <Text style={styles.label}>
              Mật khẩu{isEdit ? ' ' : ''}
              {isEdit && <Text style={styles.optional}>(để trống nếu không đổi)</Text>}
            </Text>
            <TextInput
              style={styles.input}
              value={form.password}
              onChangeText={(v) => set('password', v)}
              secureTextEntry
            />

            <Text style={styles.label}>Họ tên</Text>
            <TextInput
              style={styles.input}
              value={form.full_name}
              onChangeText={(v) => set('full_name', v)}
            />

            <Text style={styles.label}>Vai trò</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={form.role}
                onValueChange={(v) => set('role', v)}
                style={styles.picker}
              >
                <Picker.Item label="Người dùng" value="user" />
                <Picker.Item label="Admin" value="admin" />
              </Picker>
            </View>

            <Text style={styles.label}>Mã thẻ RFID (tùy chọn)</Text>
            <TextInput
              style={[styles.input, styles.mono]}
              value={form.card_uid}
              onChangeText={(v) => set('card_uid', v)}
              placeholder="VD: AB:CD:EF:12"
              autoCapitalize="characters"
            />
          </ScrollView>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitText}>{isEdit ? 'Cập nhật' : 'Tạo'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    maxHeight: '90%',
  },
  title: { fontSize: 17, fontWeight: 'bold', marginBottom: 16, color: '#1f2937' },
  label: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 4 },
  optional: { fontWeight: '400', color: '#9ca3af', fontSize: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 14,
    color: '#1f2937',
  },
  inputDisabled: { backgroundColor: '#f3f4f6', color: '#9ca3af' },
  mono: { fontFamily: 'monospace' },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    marginBottom: 14,
    overflow: 'hidden',
  },
  picker: { height: 44, color: '#1f2937' },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  submitBtn: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelText: { color: '#374151', fontWeight: '600', fontSize: 14 },
});
