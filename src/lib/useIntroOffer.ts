import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { useAuth } from '../context/AuthContext';

export const INTRO_PRICE = 99;

// Eligible service+tier combinations for the intro offer
export const INTRO_ELIGIBLE_TIERS = new Set([
  'express-exterior',       // Car Cleaning: Express Exterior Wash
]);

export const INTRO_ELIGIBLE_COOKING_PLANS = new Set([
  'veg',     // Homitra Homestyle Veg Plan
]);

export interface IntroOfferState {
  isActive: boolean;
  usedCount: number;
  slotsRemaining: number;
  loading: boolean;
}

export function useIntroOffer() {
  const { user } = useAuth();
  const [state, setState] = useState<IntroOfferState>({
    isActive: false,
    usedCount: 0,
    slotsRemaining: 0,
    loading: true,
  });

  useEffect(() => {
    if (!user?.id) {
      setState({ isActive: false, usedCount: 0, slotsRemaining: 0, loading: false });
      return;
    }

    let cancelled = false;

    async function fetchOfferState() {
      try {
        const [flagResult, countResult] = await Promise.all([
          supabase
            .from('feature_flags')
            .select('is_active')
            .eq('name', 'intro_offer')
            .maybeSingle(),
          supabase
            .from('bookings')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user!.id)
            .eq('is_intro_priced', true),
        ]);

        if (cancelled) return;

        const flagActive = flagResult.data?.is_active ?? false;
        const usedCount = countResult.count ?? 0;

        setState({
          isActive: flagActive,
          usedCount,
          slotsRemaining: Math.max(0, 2 - usedCount),
          loading: false,
        });
      } catch {
        if (!cancelled) {
          setState({ isActive: false, usedCount: 0, slotsRemaining: 0, loading: false });
        }
      }
    }

    fetchOfferState();
    return () => { cancelled = true; };
  }, [user?.id]);

  const isEligibleTier = (tierId: string) => INTRO_ELIGIBLE_TIERS.has(tierId);

  const isEligibleCookingPlan = (planId: string, bookingMode: string) =>
    INTRO_ELIGIBLE_COOKING_PLANS.has(planId) && bookingMode === 'single';

  const getEffectivePrice = (
    originalPrice: number,
    isEligible: boolean
  ): { price: number; isIntroPrice: boolean } => {
    if (state.isActive && isEligible && state.slotsRemaining > 0) {
      return { price: INTRO_PRICE, isIntroPrice: true };
    }
    return { price: originalPrice, isIntroPrice: false };
  };

  return {
    ...state,
    isEligibleTier,
    isEligibleCookingPlan,
    getEffectivePrice,
  };
}
