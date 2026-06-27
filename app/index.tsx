import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Loading } from '@/components/Loading';

export default function Index() {
  const { loading, me } = useAuth();
  if (loading) return <Loading />;
  if (!me) return <Redirect href="/login" />;
  if (me.status !== 'active') return <Redirect href="/suspended" />;
  if (!me.name) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)/discover" />;
}
