/**
 * A port of the rapid trigger state machine from `src/addons/he_trigger.cpp`
 * on the `feature/he-trigger-overhaul` branch.
 *
 * Hall effect switches report analogue travel rather than a binary press, so a
 * keypress is whatever the firmware decides it is. Rapid trigger measures from
 * wherever the finger last reversed instead of from a fixed depth, which is what
 * lets a partial release followed by a partial press re-fire.
 *
 * Everything below is in travel space, matching the firmware: 0 is rest, larger
 * values are further pressed.
 */

export interface TriggerConfig {
  /** Travel below which the switch is force-released. */
  deadzone: number;
  /** Travel at which a plain press registers. */
  actuation: number;
  /** Travel the finger must push after a reversal to re-press. */
  pressSensitivity: number;
  /** Travel the finger must release after a peak to un-press. */
  releaseSensitivity: number;
  /** Hysteresis band, sized from sensor noise. */
  noise: number;
  /** Rapid trigger on, or plain threshold actuation. */
  rapidTrigger: boolean;
  /** Keeps the rapid trigger zone live all the way down to the deadzone. */
  continuous: boolean;
}

export interface TriggerState {
  active: boolean;
  /** Rapid trigger only engages after the switch crosses actuation once. */
  armed: boolean;
  peak: number;
  trough: number;
}

export function initialState(travel = 0): TriggerState {
  return { active: false, armed: false, peak: travel, trough: travel };
}

/**
 * One firmware tick. Pure: takes the previous state and a travel reading,
 * returns the next state.
 */
export function step(
  state: TriggerState,
  travel: number,
  cfg: TriggerConfig,
): TriggerState {
  // Hard top-out. At rest the switch is released, full stop. Resetting the
  // extrema here is what stops a slow creep from leaving a key latched, and it
  // re-zeroes the trough so the next press is measured from true rest.
  if (travel <= cfg.deadzone) {
    return { active: false, armed: false, peak: travel, trough: travel };
  }

  if (!cfg.rapidTrigger) {
    // Plain actuation with a hysteresis band, so a switch resting exactly on
    // the actuation point does not chatter.
    let active = state.active;
    if (!active) {
      if (travel >= cfg.actuation + cfg.noise) active = true;
    } else {
      if (travel <= cfg.actuation - cfg.noise) active = false;
    }
    return { active, armed: false, peak: travel, trough: travel };
  }

  // Until the switch has crossed the actuation point once, behave like a plain
  // threshold. This keeps light resting pressure near the top of travel from
  // generating input.
  if (!state.armed) {
    if (travel >= cfg.actuation) {
      return { active: true, armed: true, peak: travel, trough: travel };
    }
    return {
      ...state,
      trough: Math.min(state.trough, travel),
      peak: travel,
    };
  }

  // Releasing back past the actuation point ends the rapid trigger zone, unless
  // continuous mode keeps it live all the way down to the deadzone.
  //
  // The disarm point sits one noise width *below* the actuation point rather
  // than exactly on it. Without that gap, a finger resting near the actuation
  // point makes sensor noise cross the boundary repeatedly, and each crossing
  // disarms and rearms — which reads as the button flickering on and off.
  if (!cfg.continuous && travel < cfg.actuation - cfg.noise) {
    return { active: false, armed: false, peak: travel, trough: travel };
  }

  let { peak, trough, active } = state;

  // Track the local extrema. The opposite extremum is pulled along to *at most*
  // one sensitivity away rather than reset to the current position: resetting
  // outright would let the many tiny reversals in a slow, noisy press keep
  // pushing the trough up, so the press would never accumulate enough travel to
  // fire. Clamping makes micro-reversals free while genuine reversals still
  // re-datum the next movement.
  if (travel > peak) {
    peak = travel;
    if (peak - trough > cfg.releaseSensitivity) {
      trough = peak - cfg.releaseSensitivity;
    }
  }
  if (travel < trough) {
    trough = travel;
    if (peak - trough > cfg.pressSensitivity) {
      peak = trough + cfg.pressSensitivity;
    }
  }

  // Fire against the live extremum. This is the actual rapid trigger behaviour:
  // the press is measured from wherever the finger reversed, not from a fixed
  // depth, so a partial release followed by a partial press re-triggers.
  if (!active) {
    if (travel - trough >= cfg.pressSensitivity) {
      active = true;
      peak = travel;
    }
  } else {
    if (peak - travel >= cfg.releaseSensitivity) {
      active = false;
      trough = travel;
    }
  }

  return { active, armed: true, peak, trough };
}

/** Runs a travel trace through the state machine, returning per-tick state. */
export function run(
  travels: number[],
  cfg: TriggerConfig,
): { travel: number; state: TriggerState }[] {
  let state = initialState(travels[0] ?? 0);
  return travels.map((travel) => {
    state = step(state, travel, cfg);
    return { travel, state: { ...state } };
  });
}

/** The "Standard" preset from the firmware's HE_PRESETS. */
export const STANDARD: TriggerConfig = {
  deadzone: 8,
  actuation: 40,
  pressSensitivity: 12,
  releaseSensitivity: 12,
  noise: 3,
  rapidTrigger: true,
  continuous: false,
};
