import React, { useMemo } from 'react';
import { Text, StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { tokenizeMentions } from '@/core/utils/username';
import { colors, fonts } from '@/core/theme';

interface Props {
  text: string;
  mine: boolean;
  style?: StyleProp<TextStyle>;
  mentionStyle?: StyleProp<TextStyle>;
  onPressMention?: (username: string) => void;
  disabled?: boolean;
}

/**
 * رندرِ متنِ پیام با جداسازیِ منشن‌ها (@username).
 * به صورت تودرتو (<Text onPress>) رندر می‌شود تا جریانِ خط و RTL نشکند
 * و هم‌زمان بتوان روی نامِ کاربری تپ کرد.
 */
export function MessageText({ text, mine, style, mentionStyle, onPressMention, disabled }: Props) {
  const tokens = useMemo(() => tokenizeMentions(text), [text]);

  return (
    <Text style={style}>
      {tokens.map((token, index) => {
        if (token.type === 'mention' && token.username) {
          const username = token.username;
          return (
            <Text
              key={`${index}-${token.value}`}
              suppressHighlighting={false}
              disabled={disabled}
              onPress={onPressMention ? () => onPressMention(username) : undefined}
              accessibilityRole="link"
              accessibilityLabel={`کاربر ${username}`}
              style={[
                styles.mentionBase,
                mine ? styles.mentionMine : styles.mentionTheirs,
                mentionStyle,
              ]}
            >
              {token.value}
            </Text>
          );
        }
        return token.value;
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  mentionBase: {
    fontFamily: fonts.bold,
  },
  // روی حبابِ من (طلایی روشن/زرد تیره)، منشن به رنگ تیرهٔ براق یا مشکی با خط زیرین
  mentionMine: {
    color: '#1A1208',
    textDecorationLine: 'underline',
  },
  // روی حبابِ او (تیره/خاکستری)، منشن به رنگِ طلایی شاخص
  mentionTheirs: {
    color: colors.gold,
    textDecorationLine: 'underline',
  },
});
