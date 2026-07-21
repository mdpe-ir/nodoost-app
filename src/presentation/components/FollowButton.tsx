import React from 'react';
import { type ViewStyle } from 'react-native';
import { Button } from './Button';

interface Props {
  isFollowing: boolean;
  busy?: boolean;
  onPress: () => void;
  size?: 'lg' | 'md' | 'sm';
  style?: ViewStyle;
}

/**
 * دکمه‌ی دنبال‌کردن. دنبال‌کردن برای همه‌ی سطح‌ها **رایگان** است؛ این دکمه هرگز
 * قفلِ اشتراک نشان نمی‌دهد.
 */
export function FollowButton({ isFollowing, busy, onPress, size = 'md', style }: Props) {
  return (
    <Button
      label={isFollowing ? 'دنبال‌شده' : 'دنبال کردن'}
      icon={isFollowing ? 'check' : 'plus'}
      variant={isFollowing ? 'outline' : 'gold'}
      size={size}
      loading={busy}
      onPress={onPress}
      style={style}
    />
  );
}
