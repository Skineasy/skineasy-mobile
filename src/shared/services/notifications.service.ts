import * as Notifications from 'expo-notifications';
import { addDays, format, nextSunday, parseISO, startOfDay } from 'date-fns';

import i18n from '@lib/i18n';
import { getMealByDate } from '@features/journal/data/meal.api';
import { getSleepByDate } from '@features/journal/data/sleep.api';
import { appConfig } from '@shared/config/appConfig';
import type { MealEntry, SleepEntry } from '@shared/types/journal.types';
import { logger } from '@shared/utils/logger';

import {
  getPref,
  getScheduledIds,
  setPref,
  setScheduledId,
  type NotificationKind,
} from '@shared/services/notifications.storage';

const THRESHOLDS = appConfig.notifications.thresholds;

const DAILY_JOURNAL_HOUR = 20;
const BEDTIME_HOUR = 22;
const MEAL_PLANNING_HOUR = 14;

function getYesterdayKey(): string {
  return format(addDays(new Date(), -1), 'yyyy-MM-dd');
}

function isSaturday(dateKey: string): boolean {
  return parseISO(dateKey).getDay() === 6;
}

async function hasPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

async function cancelById(kind: NotificationKind): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const matching = scheduled.filter((n) => {
      const category = (n.content.data as { category?: string } | null)?.category;
      return category === kind;
    });
    await Promise.all(
      matching.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
  } catch (err) {
    logger.warn('[notifications] cancel failed:', kind, err);
  }
  setScheduledId(kind, null);
}

async function scheduleDailyJournal(): Promise<void> {
  await cancelById('dailyJournal');
  if (!getPref('dailyJournal')) return;
  if (!(await hasPermission())) return;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t('notifications.journal.title'),
      body: i18n.t('notifications.journal.body'),
      data: { category: 'dailyJournal' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: DAILY_JOURNAL_HOUR,
      minute: 0,
    },
  });
  setScheduledId('dailyJournal', id);
}

async function scheduleTonightBedtime(): Promise<void> {
  await cancelById('bedtime');
  if (!getPref('bedtime')) return;
  if (!(await hasPermission())) return;

  const target = new Date();
  target.setHours(BEDTIME_HOUR, 0, 0, 0);
  if (target.getTime() <= Date.now()) return;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t('notifications.bedtime.title'),
      body: i18n.t('notifications.bedtime.body'),
      data: { category: 'bedtime' },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: target },
  });
  setScheduledId('bedtime', id);
}

function getNextSundayAt(hour: number): Date {
  const base = new Date();
  const isTodaySunday = base.getDay() === 0;
  const target = isTodaySunday ? startOfDay(base) : nextSunday(base);
  target.setHours(hour, 0, 0, 0);
  if (target.getTime() <= Date.now()) return nextSunday(base);
  return target;
}

async function scheduleSundayMealPlanning(): Promise<void> {
  await cancelById('mealPlanning');
  if (!getPref('mealPlanning')) return;
  if (!(await hasPermission())) return;

  const target = getNextSundayAt(MEAL_PLANNING_HOUR);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t('notifications.meals.title'),
      body: i18n.t('notifications.meals.body'),
      data: { category: 'mealPlanning' },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: target },
  });
  setScheduledId('mealPlanning', id);
}

function isBadSleep(entry: SleepEntry): boolean {
  return entry.quality < THRESHOLDS.badSleepQualityLt || entry.hours < THRESHOLDS.badSleepHoursLt;
}

function isBadMealAverage(meals: MealEntry[]): boolean {
  const scored = meals.filter((m): m is MealEntry & { quality: number } => m.quality != null);
  if (scored.length === 0) return true;
  const avg = scored.reduce((sum, m) => sum + m.quality, 0) / scored.length;
  return avg < THRESHOLDS.badMealAvgQualityLt;
}

export async function onSleepEntrySaved(entry: SleepEntry): Promise<void> {
  if (!getPref('bedtime')) return;
  if (entry.date !== getYesterdayKey()) return;

  if (isBadSleep(entry)) await scheduleTonightBedtime();
  else await cancelById('bedtime');
}

export async function onSleepEntryDeleted(date: string): Promise<void> {
  if (date === getYesterdayKey()) await cancelById('bedtime');
}

export async function onMealEntryChanged(date: string): Promise<void> {
  if (!getPref('mealPlanning')) return;
  if (date !== getYesterdayKey()) return;
  if (!isSaturday(date)) return;

  const meals = await getMealByDate(date);
  if (isBadMealAverage(meals)) await scheduleSundayMealPlanning();
  else await cancelById('mealPlanning');
}

async function resyncBedtime(): Promise<void> {
  if (!getPref('bedtime')) {
    await cancelById('bedtime');
    return;
  }
  const yesterday = getYesterdayKey();
  const entries = await getSleepByDate(yesterday);
  const entry = entries[0];
  if (!entry) {
    await cancelById('bedtime');
    return;
  }
  if (isBadSleep(entry)) await scheduleTonightBedtime();
  else await cancelById('bedtime');
}

async function resyncMealPlanning(): Promise<void> {
  if (!getPref('mealPlanning')) {
    await cancelById('mealPlanning');
    return;
  }
  const yesterday = getYesterdayKey();
  if (!isSaturday(yesterday)) {
    await scheduleSundayMealPlanning();
    return;
  }
  const meals = await getMealByDate(yesterday);
  if (isBadMealAverage(meals)) await scheduleSundayMealPlanning();
  else await cancelById('mealPlanning');
}

export async function resyncAll(): Promise<void> {
  if (!(await hasPermission())) return;
  try {
    await scheduleDailyJournal();
    await resyncBedtime();
    await resyncMealPlanning();
    logger.info('[notifications] resyncAll done');
  } catch (err) {
    logger.warn('[notifications] resyncAll failed:', err);
  }
}

export async function setNotificationPref(kind: NotificationKind, value: boolean): Promise<void> {
  setPref(kind, value);
  if (kind === 'dailyJournal') {
    if (value) await scheduleDailyJournal();
    else await cancelById('dailyJournal');
    return;
  }
  if (kind === 'bedtime') {
    if (value) await resyncBedtime();
    else await cancelById('bedtime');
    return;
  }
  if (value) await resyncMealPlanning();
  else await cancelById('mealPlanning');
}

export function getNotificationPref(kind: NotificationKind): boolean {
  return getPref(kind);
}
