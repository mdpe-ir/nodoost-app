import React from 'react';
import { LoginScreen } from '@/presentation/screens/LoginScreen';

/**
 * افزودنِ حساب — همان صفحه‌ی ورود با متن‌های «افزودن» و دکمه‌ی بستن.
 *
 * مسیرِ جدا از `/login` است تا کاربرِ واردشده‌ای که اشتباهی به `/login`
 * برگردد، به‌جای صفحه‌ی «افزودن» همان صفحه‌ی ورودِ معمولی را ببیند.
 */
export default function AddAccountRoute() {
  return <LoginScreen mode="add" />;
}
