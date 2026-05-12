import React, {memo} from 'react';
import {Image, ImageStyle, StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import {theme} from '@/theme/theme';

export type AplusIconName =
  | 'admin'
  | 'alert'
  | 'back'
  | 'battery'
  | 'bell'
  | 'bluetooth'
  | 'calendar'
  | 'card'
  | 'check'
  | 'chevron'
  | 'close'
  | 'command'
  | 'credential'
  | 'recipient'
  | 'capability'
  | 'revoked'
  | 'sync'
  | 'matrix'
  | 'door'
  | 'email'
  | 'face'
  | 'fingerprint'
  | 'firmware'
  | 'gateway'
  | 'history'
  | 'home'
  | 'hotel'
  | 'key'
  | 'lock'
  | 'logout'
  | 'more'
  | 'office'
  | 'otp'
  | 'password'
  | 'phone'
  | 'pin'
  | 'plus'
  | 'qr'
  | 'refresh'
  | 'remote'
  | 'settings'
  | 'shield'
  | 'signal'
  | 'unlock'
  | 'user'
  | 'wifi';

type Props = {
  name: AplusIconName;
  size?: number;
  color?: string;
  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ImageStyle>;
  boxed?: boolean;
  boxSize?: number;
};

const iconSources: Record<AplusIconName, number> = {
  admin: require('@/assets/icons/admin.png'),
  alert: require('@/assets/icons/alert.png'),
  back: require('@/assets/icons/back.png'),
  battery: require('@/assets/icons/battery.png'),
  bell: require('@/assets/icons/bell.png'),
  bluetooth: require('@/assets/icons/bluetooth.png'),
  calendar: require('@/assets/icons/calendar.png'),
  card: require('@/assets/icons/card.png'),
  check: require('@/assets/icons/check.png'),
  chevron: require('@/assets/icons/chevron.png'),
  close: require('@/assets/icons/close.png'),
  command: require('@/assets/icons/command.png'),
  credential: require('@/assets/icons/credential.png'),
  recipient: require('@/assets/icons/recipient.png'),
  capability: require('@/assets/icons/capability.png'),
  revoked: require('@/assets/icons/revoked.png'),
  sync: require('@/assets/icons/sync.png'),
  matrix: require('@/assets/icons/matrix.png'),
  door: require('@/assets/icons/door.png'),
  email: require('@/assets/icons/email.png'),
  face: require('@/assets/icons/face.png'),
  fingerprint: require('@/assets/icons/fingerprint.png'),
  firmware: require('@/assets/icons/firmware.png'),
  gateway: require('@/assets/icons/gateway.png'),
  history: require('@/assets/icons/history.png'),
  home: require('@/assets/icons/home.png'),
  hotel: require('@/assets/icons/hotel.png'),
  key: require('@/assets/icons/key.png'),
  lock: require('@/assets/icons/lock.png'),
  logout: require('@/assets/icons/logout.png'),
  more: require('@/assets/icons/more.png'),
  office: require('@/assets/icons/office.png'),
  otp: require('@/assets/icons/otp.png'),
  password: require('@/assets/icons/password.png'),
  phone: require('@/assets/icons/phone.png'),
  pin: require('@/assets/icons/pin.png'),
  plus: require('@/assets/icons/plus.png'),
  qr: require('@/assets/icons/qr.png'),
  refresh: require('@/assets/icons/refresh.png'),
  remote: require('@/assets/icons/remote.png'),
  settings: require('@/assets/icons/settings.png'),
  shield: require('@/assets/icons/shield.png'),
  signal: require('@/assets/icons/signal.png'),
  unlock: require('@/assets/icons/unlock.png'),
  user: require('@/assets/icons/user.png'),
  wifi: require('@/assets/icons/wifi.png'),
};

function AplusIconComponent({
  name,
  size = 22,
  color,
  boxed = false,
  boxSize,
  containerStyle,
  style,
}: Props) {
  const icon = (
    <Image
      source={iconSources[name]}
      resizeMode="contain"
      style={[
        {width: size, height: size},
        color ? {tintColor: color} : null,
        style,
      ]}
    />
  );

  if (!boxed) {
    return icon;
  }

  const actualBoxSize = boxSize ?? size + 20;
  return (
    <View
      style={[
        styles.box,
        {
          width: actualBoxSize,
          height: actualBoxSize,
          borderRadius: Math.round(actualBoxSize / 3.2),
        },
        containerStyle,
      ]}>
      {icon}
    </View>
  );
}

export const AplusIcon = memo(AplusIconComponent);

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
});
